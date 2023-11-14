package storage

import (
	"bytes"
	"cargomail/internal/mailbox/repository"
	"cargomail/internal/shared/config"
	b64 "encoding/base64"
	"errors"
	"io"
	"mime/multipart"
	"net/textproto"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type Storage struct {
	Blobs    UseBlobStorage
	Files    UseFileStorage
	Drafts   UseDraftStorage
	Messages UseMessageStorage
}

func NewStorage(repository repository.Repository) Storage {
	return Storage{
		Blobs:    &BlobStorage{repository},
		Files:    &FileStorage{repository},
		Drafts:   &DraftStorage{repository, BlobStorage{repository}},
		Messages: &MessageStorage{repository, BlobStorage{repository}},
	}
}

type GenericMessage interface {
	repository.Draft | repository.Message
}

func ParsePlaceholderMessage[M GenericMessage](user *repository.User, repo repository.Repository, blobStorage BlobStorage, genericMessages []*M) ([]*M, error) {
	var updateParts func(parts []*repository.MessagePart) error

	updateParts = func(parts []*repository.MessagePart) error {
		var err error

		for j := range parts {
			contentDisposition, _ := parts[j].Headers["Content-Disposition"].(string)

			if contentDisposition == "inline" {
				contentTypes, ok := parts[j].Headers["Content-Type"].([]interface{})
				if ok {
					digest, ok := parts[j].Headers["Content-ID"].(string)
					if ok {
						v := strings.SplitAfter(digest, "<")
						if len(v) > 0 {
							digest = strings.TrimRight(v[1], ">")
						}

						for k := range parts[j].Headers {
							if k != "Content-Disposition" {
								delete(parts[j].Headers, k)
							}
						}

						blob, err := repo.Blobs.GetByDigest(user, digest)
						if err != nil {
							return err
						}

						blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)
						blobPath := filepath.Join(blobsPath, digest)

						buf := new(bytes.Buffer)

						err = blobStorage.Load(buf, blob, blobPath)
						if err != nil {
							return err
						}

						data := b64.StdEncoding.EncodeToString(buf.Bytes())
						if err != nil {
							return err
						}

						body := &repository.Body{
							Data: data,
						}

						parts[j].Body = body

						parts[j].Headers["Content-Transfer-Encoding"] = "base64"
						parts[j].Headers["Content-Type"] = contentTypes[1].(string)
					}
				}
			}

			err = updateParts(parts[j].Parts)
		}
		return err
	}

	if drafts, ok := any(genericMessages).([]*repository.Draft); ok {
		for i := range drafts {
			err := updateParts(drafts[i].Payload.Parts)
			if err != nil {
				return nil, err
			}
		}

		return genericMessages, nil
	}

	if messages, ok := any(genericMessages).([]*repository.Message); ok {
		for i := range messages {
			updateParts(messages[i].Payload.Parts)
			// e.g. the resource file not found => ignore error
			// err := updateParts(messages[i].Payload.Parts)
			// if err != nil {
			// 	return nil, err
			// }
		}

		return genericMessages, nil
	}

	return nil, repository.ErrUnknownMessageType
}

func ComposePlaceholderMessage(user *repository.User, blobStorage BlobStorage, draft *repository.Draft) (*repository.Draft, error) {
	body := &bytes.Buffer{}
	multipartWriter := multipart.NewWriter(body)

	var parseParts func(parts []*repository.MessagePart) error

	parseParts = func(parts []*repository.MessagePart) error {
		var err error

		for i := range parts {
			var data []byte

			contentDisposition, _ := parts[i].Headers["Content-Disposition"].(string)

			if contentDisposition == "inline" {

				contentTransferEncoding, _ := parts[i].Headers["Content-Transfer-Encoding"].(string)

				if contentTransferEncoding == "base64" {
					data, err = b64.StdEncoding.DecodeString(parts[i].Body.Data)
					if err != nil {
						return err
					}
				} else {
					data = []byte(parts[i].Body.Data)
				}

				dataReader := bytes.NewReader(data)

				contentType, ok := parts[i].Headers["Content-Type"].(string)
				if !ok {
					return repository.ErrMissingContentType
				}

				mimeHeader := make(textproto.MIMEHeader)
				mimeHeader.Set("Content-Disposition", contentDisposition)
				mimeHeader.Set("Content-Type", contentType)
				mimeHeader.Set("Content-Length", strconv.FormatInt(int64(dataReader.Size()), 10))

				part, err := multipartWriter.CreatePart(mimeHeader)
				if err != nil {
					return err
				}

				io.Copy(part, dataReader)
			}

			err = parseParts(parts[i].Parts)
		}
		return err
	}

	if draft.Payload == nil {
		return nil, repository.ErrEmptyPayload
	}

	blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

	if _, err := os.Stat(blobsPath); errors.Is(err, os.ErrNotExist) {
		err := os.MkdirAll(blobsPath, os.ModePerm)
		if err != nil {
			return nil, err
		}
	}

	err := parseParts(draft.Payload.Parts)
	if err != nil {
		return nil, err
	}

	multipartWriter.Close()

	multipartReader := multipart.NewReader(body, multipartWriter.Boundary())

	uploadedBlobs, err := blobStorage.CleanAndStoreMultipart(user, draft.Id, multipartReader, blobsPath)
	if err != nil {
		return nil, err
	}

	// create a placeholder message

	var updateParts func(parts []*repository.MessagePart) error

	updateParts = func(parts []*repository.MessagePart) error {
		var err error

		j := 0

		for i := range parts {
			contentDisposition, _ := parts[i].Headers["Content-Disposition"].(string)

			if contentDisposition == "inline" {
				parts[i].Body = nil

				for k := range parts[i].Headers {
					if k != "Content-Disposition" {
						delete(parts[i].Headers, k)
					}
				}

				size := strconv.FormatInt(uploadedBlobs[j].Size, 10)

				type ContentTypes []string

				var contentTypes ContentTypes

				contentTypes = append(contentTypes, `message/external-body; access-type="x-content-addressed-uri"; hash-algorithm="sha256"; size="`+size+`"`)
				contentTypes = append(contentTypes, uploadedBlobs[j].ContentType)

				parts[i].Headers["Content-ID"] = `<` + uploadedBlobs[j].Digest + `>`
				parts[i].Headers["Content-Type"] = contentTypes

				j++
			}

			err = updateParts(parts[i].Parts)
		}
		return err
	}

	err = updateParts(draft.Payload.Parts)
	if err != nil {
		return nil, err
	}

	return draft, err
}
