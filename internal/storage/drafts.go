package storage

import (
	"bytes"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	b64 "encoding/base64"
	"errors"
	"io"
	"log"
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

	body := &bytes.Buffer{}
	multipartWriter := multipart.NewWriter(body)

	for i := range draft.Payload.Parts {
		var data []byte
		var err error

		contentDisposition, _ := draft.Payload.Parts[i].Headers["Content-Disposition"].(string)

		if contentDisposition == "inline" {

			contentTransferEncoding, _ := draft.Payload.Parts[i].Headers["Content-Transfer-Encoding"].(string)

			if contentTransferEncoding == "base64" {
				data, err = b64.StdEncoding.DecodeString(draft.Payload.Parts[i].Body.Data)
				if err != nil {
					return nil, err
				}
			} else {
				data = []byte(draft.Payload.Parts[i].Body.Data)
			}

			dataReader := bytes.NewReader(data)

			contentType, ok := draft.Payload.Parts[i].Headers["Content-Type"].(string)
			if !ok {
				return nil, repository.ErrMissingContentType
			}

			mimeHeader := make(textproto.MIMEHeader)
			mimeHeader.Set("Content-Disposition", contentDisposition)
			mimeHeader.Set("Content-Type", contentType)
			mimeHeader.Set("Content-Length", strconv.FormatInt(int64(dataReader.Size()), 10))

			part, err := multipartWriter.CreatePart(mimeHeader)
			if err != nil {
				return nil, err
			}

			io.Copy(part, dataReader)
		}
	}

	multipartWriter.Close()

	multipartReader := multipart.NewReader(body, multipartWriter.Boundary())

	uploadedBlobs, err := s.blobStorage.CleanAndStoreMultipart(user, draft.Id, multipartReader, blobsPath)
	if err != nil {
		return nil, err
	}

	log.Printf("uploadedBlobs: %v", uploadedBlobs)

	draft, err = s.repository.Drafts.Update(user, draft)
	if err != nil {
		return nil, err
	}

	return draft, nil
}

func (s *DraftStorage) List(user *repository.User) (*repository.DraftList, error) {
	return s.repository.Drafts.List(user)
}
