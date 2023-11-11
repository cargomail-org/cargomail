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
	"net/http"
	"os"
	"path/filepath"
)

type UseFileStorage interface {
	Store(user *repository.User, file multipart.File, filesPath, uuid, filename, contentType string) (*repository.File, error)
	Load(w http.ResponseWriter, file *repository.File, filePath string) error
}

type FileStorage struct {
	repository repository.Repository
}

func (s *FileStorage) Store(user *repository.User, file multipart.File, filesPath, uuid, filename, contentType string) (*repository.File, error) {
	f, err := os.OpenFile(filepath.Join(filesPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	salt := make([]byte, repository.SaltSize)
	_, err = rand.Read(salt)
	if err != nil {
		return nil, err
	}

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

	hash := sha256.New()

	_, err = hash.Write(salt)
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
		_, err := io.Copy(writer, io.TeeReader(file, hash))
		if err != nil {
			pipeWriter.CloseWithError(err)
			return
		}
		defer pipeWriter.Close()
	}()

	written, err := io.Copy(f, pipeReader)
	if err != nil {
		return nil, err
	}

	hashSum := hash.Sum(nil)
	digest := b64.RawURLEncoding.EncodeToString(hashSum)

	/*aes, err := aes.NewCipher(key)
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

	_, err = hash.Write(salt)
	if err != nil {
		return nil, err
	}

	written, err := io.Copy(f, io.TeeReader(pipeReader, hash))
	if err != nil {
		return nil, err
	}

	hashSum := hash.Sum(nil)
	digest := b64.RawURLEncoding.EncodeToString(hashSum)*/

	fileMetadata := &repository.FileMetadata{
		Salt: b64.RawURLEncoding.EncodeToString(salt),
		Key:  b64.RawURLEncoding.EncodeToString(key),
		Iv:   b64.RawURLEncoding.EncodeToString(iv),
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

func (s *FileStorage) Load(w http.ResponseWriter, file *repository.File, filePath string) error {
	out, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer out.Close()

	salt, err := b64.RawURLEncoding.DecodeString(file.Metadata.Salt)
	if err != nil {
		return err
	}

	key, err := b64.RawURLEncoding.DecodeString(file.Metadata.Key)
	if err != nil {
		return err
	}

	iv, err := b64.RawURLEncoding.DecodeString(file.Metadata.Iv)
	if err != nil {
		return err
	}

	aes, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	stream := cipher.NewCTR(aes, iv)

	pipeReader, pipeWriter := io.Pipe()
	writer := &cipher.StreamWriter{S: stream, W: pipeWriter}

	// do the encryption in a goroutine
	go func() {
		_, err := io.Copy(writer, out)
		if err != nil {
			pipeWriter.CloseWithError(err)
			return
		}
		defer pipeWriter.Close()
	}()

	hash := sha256.New()

	_, err = hash.Write(salt)
	if err != nil {
		return err
	}

	_, err = io.Copy(hash, pipeReader)
	if err != nil {
		return err
	}

	hashSum := hash.Sum(nil)
	digest := b64.RawURLEncoding.EncodeToString(hashSum)

	if digest != file.Digest {
		return repository.ErrWrongResourceDigest
	}

	// do it once more (no way to avoid it)
	out.Seek(0, io.SeekStart)

	stream2 := cipher.NewCTR(aes, iv)

	pipeReader2, pipeWriter2 := io.Pipe()
	writer2 := &cipher.StreamWriter{S: stream2, W: pipeWriter2}

	// do the encryption in a goroutine
	go func() {
		_, err := io.Copy(writer2, out)
		if err != nil {
			pipeWriter2.CloseWithError(err)
			return
		}
		defer pipeWriter2.Close()
	}()

	_, err = io.Copy(w, pipeReader2)
	if err != nil {
		return err
	}

	/*hash := sha256.New()

	_, err = hash.Write(salt)
	if err != nil {
		return err
	}

	if _, err := io.Copy(hash, out); err != nil {
		return err
	}

	hashSum := hash.Sum(nil)
	digest := b64.RawURLEncoding.EncodeToString(hashSum)

	if digest != file.Digest {
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
		defer pipeWriter.Close()
	}()

	_, err = io.Copy(w, pipeReader)
	if err != nil {
		return err
	}*/

	return nil
}
