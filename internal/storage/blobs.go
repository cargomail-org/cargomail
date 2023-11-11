package storage

import (
	"cargomail/internal/config"
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

	"github.com/google/uuid"
)

type UseBlobStorage interface {
	Store(user *repository.User, file multipart.File, blobsPath, uuid, filename, contentType string) (*repository.Blob, error)
	CleanAndStoreMultipart(user *repository.User, draftId string, body *multipart.Reader, blobsPath string) ([]*repository.Blob, error)
	Load(w io.Writer, blob *repository.Blob, blobPath string) error
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
		pipeWriter.Close()
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

	blobMetadata := &repository.BlobMetadata{
		Salt: b64.RawURLEncoding.EncodeToString(salt),
		Key:  b64.RawURLEncoding.EncodeToString(key),
		Iv:   b64.RawURLEncoding.EncodeToString(iv),
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

func (s *BlobStorage) CleanAndStoreMultipart(user *repository.User, draftId string, reader *multipart.Reader, blobsPath string) ([]*repository.Blob, error) {
	uploadedBlobs := []*repository.Blob{}

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		header := part.Header

		uuid := uuid.NewString()

		f, err := os.OpenFile(filepath.Join(blobsPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
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
			_, err := io.Copy(writer, io.TeeReader(part, hash))
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
			_, err := io.Copy(writer, part)
			if err != nil {
				pipeWriter.CloseWithError(err)
				return
			}
			pipeWriter.Close()
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

		blobMetadata := &repository.BlobMetadata{
			Salt: b64.RawURLEncoding.EncodeToString(salt),
			Key:  b64.RawURLEncoding.EncodeToString(key),
			Iv:   b64.RawURLEncoding.EncodeToString(iv),
		}
		contentType := header.Values("Content-Type")

		uploadedBlob := &repository.Blob{
			DraftId:     &draftId,
			Digest:      digest,
			Size:        written,
			Metadata:    blobMetadata,
			ContentType: contentType[0],
		}

		uploadedBlobs = append(uploadedBlobs, uploadedBlob)

		os.Rename(filepath.Join(blobsPath, uuid), filepath.Join(blobsPath, digest))
		if err != nil {
			return nil, err
		}
	}

	removedBlobs, createdBlobs, err := s.repository.Blobs.CleanAndCreate(user, uploadedBlobs, draftId)
	if err != nil {
		return nil, err
	}

	blobsPath = filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

	// remove the old blobs from disk
	for i := range removedBlobs {
		_ = os.Remove(filepath.Join(blobsPath, removedBlobs[i].Digest))
	}

	return createdBlobs, nil
}

func (s *BlobStorage) Load(w io.Writer, blob *repository.Blob, blobPath string) error {
	out, err := os.Open(blobPath)
	if err != nil {
		// the resource file not found
		return err
	}
	defer out.Close()

	salt, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Salt)
	if err != nil {
		return err
	}

	key, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Key)
	if err != nil {
		return err
	}

	iv, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Iv)
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

	if digest != blob.Digest {
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
		return err
	}*/

	return nil
}
