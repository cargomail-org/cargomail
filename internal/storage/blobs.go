package storage

import (
	"cargomail/internal/repository"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	b64 "encoding/base64"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
)

type BlobStore interface {
	Create(user *repository.User, file multipart.File, blobsPath, uuid, filename, contentType string) (*repository.Blob, error)
	// Update(user *repository.User, file multipart.File, blobsPath, uuid, filename, contentType string) (*repository.Blob, error)
	// List(context.Context, int) (*repository.BlobList, error)
}

type BlobStorage struct {
	repository repository.Repository
}

func (s *BlobStorage) Create(user *repository.User, file multipart.File, blobsPath, uuid, filename, contentType string) (*repository.Blob, error) {
	f, err := os.OpenFile(filepath.Join(blobsPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	key := make([]byte, repository.KeySize)
	_, err = rand.Read(key)
	if err != nil {
		return nil, err
	}

	iv := make([]byte, repository.IvSize)
	_, err = rand.Read(iv)
	if err != nil {
		return nil, err
	}

	aes, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	stream := cipher.NewCTR(aes, iv)

	pipeReader, pipeWriter := io.Pipe()
	writer := &cipher.StreamWriter{S: stream, W: pipeWriter}

	// do the encryption in a goroutine
	go func() {
		_, err := io.Copy(writer, file)
		if err != nil {
			pipeWriter.CloseWithError(err)
			return
		}
		pipeWriter.Close()
	}()

	hash := sha256.New()

	_, err = hash.Write(iv)
	if err != nil {
		return nil, err
	}

	written, err := io.Copy(f, io.TeeReader(pipeReader, hash))
	if err != nil {
		return nil, err
	}

	hashSum := hash.Sum(nil)
	digest := b64.RawURLEncoding.EncodeToString(hashSum)

	blobMetadata := &repository.BlobMetadata{
		Key: b64.RawURLEncoding.EncodeToString(key),
		Iv:  b64.RawURLEncoding.EncodeToString(iv),
	}

	uploadedBlob := &repository.Blob{
		Digest:      digest,
		Name:        filename,
		Size:        written,
		Metadata:    blobMetadata,
		ContentType: contentType,
	}

	uploadedBlob, err = s.repository.Blobs.Create(user, uploadedBlob)
	if err != nil {
		return nil, err
	}

	os.Rename(filepath.Join(blobsPath, uuid), filepath.Join(blobsPath, digest))
	if err != nil {
		return nil, err
	}

	return uploadedBlob, nil
}
