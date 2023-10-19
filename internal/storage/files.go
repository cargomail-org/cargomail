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

type FileStore interface {
	Create(user *repository.User, file multipart.File, filesPath, uuid, filename, contentType string) (*repository.File, error)
	// List(*repository.User, ) (*repository.FileList, error)
}

type FileStorage struct {
	repository repository.Repository
}

func (s *FileStorage) Create(user *repository.User, file multipart.File, filesPath, uuid, filename, contentType string) (*repository.File, error) {
	f, err := os.OpenFile(filepath.Join(filesPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
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
		defer pipeWriter.Close()
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

	fileMetadata := &repository.FileMetadata{
		Key: b64.RawURLEncoding.EncodeToString(key),
		Iv:  b64.RawURLEncoding.EncodeToString(iv),
	}

	uploadedFile := &repository.File{
		Digest:      digest,
		Name:        filename,
		Size:        written,
		Metadata:    fileMetadata,
		ContentType: contentType,
	}

	uploadedFile, err = s.repository.Files.Create(user, uploadedFile)
	if err != nil {
		return nil, err
	}

	os.Rename(filepath.Join(filesPath, uuid), filepath.Join(filesPath, digest))
	if err != nil {
		return nil, err
	}

	return uploadedFile, nil
}
