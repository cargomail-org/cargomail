package storage

import (
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	b64 "encoding/base64"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
)

type UseBlobStorage interface {
	Store(user *repository.User, file multipart.File, blobsPath, uuid, filename, contentType string) (*repository.Blob, error)
	Rewrite(user *repository.User, blob *repository.Blob, file multipart.File, blobsPath, uuid, filename, contentType string) (*repository.Blob, error)
	Load(w http.ResponseWriter, blob *repository.Blob, blobPath string) error
}

type BlobStorage struct {
	repository repository.Repository
}

func (s *BlobStorage) Store(user *repository.User, file multipart.File, blobsPath, uuid, filename, contentType string) (*repository.Blob, error) {
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

func (s *BlobStorage) Rewrite(user *repository.User, blob *repository.Blob, file multipart.File, blobsPath, uuid, filename, contentType string) (*repository.Blob, error) {
	f, err := os.OpenFile(filepath.Join(blobsPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	blobDigestToRemove := blob.Digest

	key, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Key)
	if err != nil {
		return nil, err
	}

	iv, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Iv)
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

	uploadedBlob := &repository.Blob{
		Id:          blob.Id,
		Digest:      digest,
		Size:        written,
		ContentType: contentType,
	}

	uploadedBlob, err = s.repository.Blobs.Update(user, uploadedBlob)
	if err != nil {
		return nil, err
	}

	os.Rename(filepath.Join(blobsPath, uuid), filepath.Join(blobsPath, digest))
	if err != nil {
		return nil, err
	}

	blobsPath = filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

	// delete the old blob
	_ = os.Remove(filepath.Join(blobsPath, blobDigestToRemove))

	return uploadedBlob, nil
}

func (s *BlobStorage) Load(w http.ResponseWriter, blob *repository.Blob, blobPath string) error {
	out, err := os.Open(blobPath)
	if err != nil {
		return err
	}
	defer out.Close()

	key, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Key)
	if err != nil {
		return err
	}

	iv, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Iv)
	if err != nil {
		return err
	}

	hash := sha256.New()

	_, err = hash.Write(iv)
	if err != nil {
		return err
	}

	if _, err := io.Copy(hash, out); err != nil {
		return err
	}

	hashSum := hash.Sum(nil)
	digest := b64.RawURLEncoding.EncodeToString(hashSum)

	if digest != blob.Digest {
		return repository.ErrWrongResourceDigest
	}

	out.Seek(0, io.SeekStart)

	aes, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	stream := cipher.NewCTR(aes, iv)

	pipeReader, pipeWriter := io.Pipe()
	writer := &cipher.StreamWriter{S: stream, W: pipeWriter}

	// do the decryption in a goroutine
	go func() {
		// _, err := io.Copy(writer, io.TeeReader(out, hash))
		_, err := io.Copy(writer, out)
		if err != nil {
			pipeWriter.CloseWithError(err)
			return
		}
		pipeWriter.Close()
	}()

	_, err = io.Copy(w, pipeReader)
	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}
