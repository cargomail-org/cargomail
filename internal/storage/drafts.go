package storage

import (
	"bytes"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	b64 "encoding/base64"
	"errors"
	"io"
	"mime/multipart"
	"net/textproto"
	"os"
	"path/filepath"
	"strconv"
)

type UseDraftStorage interface {
	Create(user *repository.User, draft *repository.Draft) (*repository.Draft, error)
	Update(user *repository.User, draft *repository.Draft) (*repository.Draft, error)
	List(user *repository.User) (*repository.DraftList, error)
	// Trash(user *repository.User, ids string) error
	// Untrash(user *repository.User, ids string) error
	// Delete(user *repository.User, ids string) error
	// Send(user *repository.User, draft *repository.Draft) (*repository.Message, error)
}

type DraftStorage struct {
	repository  repository.Repository
	blobStorage BlobStorage
}

func (s *DraftStorage) Create(user *repository.User, draft *repository.Draft) (*repository.Draft, error) {
	return s.repository.Drafts.Create(user, draft)
}

func (s *DraftStorage) Update(user *repository.User, draft *repository.Draft) (*repository.Draft, error) {
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

	uploadedBlobs, err := s.blobStorage.CleanAndStoreMultipart(user, draft.Id, multipartReader, blobsPath)
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

	draft, err = s.repository.Drafts.Update(user, draft)
	if err != nil {
		return nil, err
	}

	return draft, nil
}

func (s *DraftStorage) List(user *repository.User) (*repository.DraftList, error) {
	return s.repository.Drafts.List(user)
}
