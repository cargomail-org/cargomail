package storage

import (
	"bytes"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	b64 "encoding/base64"
	"path/filepath"
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
			err := updateParts(messages[i].Payload.Parts)
			if err != nil {
				return nil, err
			}
		}

		return genericMessages, nil
	}

	return nil, repository.ErrUnknownMessageType
}
