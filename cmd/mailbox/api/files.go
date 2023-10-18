package api

import (
	"cargomail/cmd/mailbox/api/helper"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	b64 "encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"

	"github.com/google/uuid"
)

type FilesApi struct {
	files repository.FileRepository
}

func (api *FilesApi) Upload() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		err := r.ParseMultipartForm(32 << 20)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		uploadedFiles := []*repository.File{}

		files := r.MultipartForm.File["files"]
		for i := range files {
			file, err := files[i].Open()
			if err != nil {
				fmt.Println(err)
				return
			}
			defer file.Close()

			filesPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.FilesFolder)

			if _, err := os.Stat(filesPath); errors.Is(err, os.ErrNotExist) {
				err := os.MkdirAll(filesPath, os.ModePerm)
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}
			}

			uuid := uuid.NewString()

			f, err := os.OpenFile(filepath.Join(filesPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
			if err != nil {
				fmt.Println(err)
				return
			}
			defer f.Close()

			key := make([]byte, KeySize)
			_, err = rand.Read(key)
			if err != nil {
				fmt.Println(err)
				return
			}

			iv := make([]byte, IvSize)
			_, err = rand.Read(iv)
			if err != nil {
				fmt.Println(err)
				return
			}

			aes, err := aes.NewCipher(key)
			if err != nil {
				fmt.Println(err)
				return
			}

			stream := cipher.NewCTR(aes, iv)

			pipeReader, pipeWriter := io.Pipe()
			writer := &cipher.StreamWriter{S: stream, W: pipeWriter}

			// do the encryption in a goroutine
			go func() {
				_, err := io.Copy(writer, file)
				if err != nil {
					fmt.Println(err)
					return
				}
				defer writer.Close()
			}()

			hash := sha256.New()
			
			_, err = hash.Write(iv)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			written, err := io.Copy(f, io.TeeReader(pipeReader, hash))
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			hashSum := hash.Sum(nil)
			digest := b64.RawURLEncoding.EncodeToString(hashSum)

			fileMetadata := &repository.FileMetadata{
				Key: b64.RawURLEncoding.EncodeToString(key),
				Iv:  b64.RawURLEncoding.EncodeToString(iv),
			}

			contentType := files[i].Header.Get("content-type")

			uploadedFile := &repository.File{
				Digest:      digest,
				Name:        files[i].Filename,
				Size:        written,
				Metadata:    fileMetadata,
				ContentType: contentType,
			}

			uploadedFile, err = api.files.Create(user, uploadedFile)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			os.Rename(filepath.Join(filesPath, uuid), filepath.Join(filesPath, digest))
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			if uploadedFile != nil && (repository.File{}) != *uploadedFile {
				uploadedFiles = append(uploadedFiles, uploadedFile)
			}
		}

		if len(uploadedFiles) > 0 {
			helper.SetJsonResponse(w, http.StatusCreated, uploadedFiles)
		} else {
			helper.SetJsonResponse(w, http.StatusOK, uploadedFiles)
		}
	})
}

func (api *FilesApi) Download() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		digest := path.Base(r.URL.Path)

		file, err := api.files.GetFileByDigest(user, digest)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		if len(file.Name) == 0 {
			helper.ReturnErr(w, repository.ErrFileNotFound, http.StatusNotFound)
			return
		}

		if r.Method == "HEAD" {
			w.WriteHeader(http.StatusOK)
		} else if r.Method == "GET" {
			asciiFileName, err := helper.ToAscii(file.Name)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			urlEncodedFileName, err := url.Parse(file.Name)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			filesPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.FilesFolder)

			filePath := filepath.Join(filesPath, digest)
			w.Header().Set("Content-Type", "application/octet-stream")
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q; filename*=UTF-8''%s", asciiFileName, urlEncodedFileName))

			filePath = filepath.Clean(filePath)

			out, err := os.Open(filePath)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}
			defer out.Close()

			key, err := b64.RawURLEncoding.DecodeString(file.Metadata.Key)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			iv, err := b64.RawURLEncoding.DecodeString(file.Metadata.Iv)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			hash := sha256.New()

			_, err = hash.Write(iv)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			if _, err := io.Copy(hash, out); err != nil {
				fmt.Println(err)
				return
			}

			hashSum := hash.Sum(nil)
			digest := b64.RawURLEncoding.EncodeToString(hashSum)

			if digest != file.Digest {
				helper.ReturnErr(w, repository.ErrWrongResourceDigest, http.StatusInternalServerError)
				return
			}

			out.Seek(0, io.SeekStart)

			aes, err := aes.NewCipher(key)
			if err != nil {
				fmt.Println(err)
				return
			}

			stream := cipher.NewCTR(aes, iv)

			pipeReader, pipeWriter := io.Pipe()
			writer := &cipher.StreamWriter{S: stream, W: pipeWriter}

			// do the decryption in a goroutine
			go func() {
				// _, err := io.Copy(writer, io.TeeReader(out, hash))
				_, err := io.Copy(writer, out)
				if err != nil {
					fmt.Println(err)
					return
				}
				defer writer.Close()
			}()

			_, err = io.Copy(w, pipeReader)
			if err != nil {
				fmt.Println(err)
				return
			}
		}
	})
}

func (api *FilesApi) List() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var folder repository.Folder

		err := helper.Decoder(r.Body).Decode(&folder)
		if err != nil {
			if err.Error() != "EOF" {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
		}

		fileList, err := api.files.List(user, folder.Folder)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, fileList)
	})
}

func (api *FilesApi) Sync() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var history *repository.History

		err := helper.Decoder(r.Body).Decode(&history)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		fileSync, err := api.files.Sync(user, history)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, fileSync)
	})
}

func (api *FilesApi) Trash() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var ids repository.Ids

		err := helper.Decoder(r.Body).Decode(&ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if ids.Ids == nil {
			http.Error(w, repository.ErrMissingIdsField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		idsString := string(body)

		err = api.files.Trash(user, idsString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *FilesApi) Untrash() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var ids repository.Ids

		err := helper.Decoder(r.Body).Decode(&ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if ids.Ids == nil {
			http.Error(w, repository.ErrMissingIdsField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		idsString := string(body)

		err = api.files.Untrash(user, idsString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *FilesApi) Delete() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var ids repository.Ids

		err := helper.Decoder(r.Body).Decode(&ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if ids.Ids == nil {
			http.Error(w, repository.ErrMissingIdsField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		idsString := string(body)

		_, err = api.files.Delete(user, idsString)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		//TODO remove if no reference

		// filesPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.FilesFolder)

		// for _, file := range *files {
		// 	_ = os.Remove(filepath.Join(filesPath, file.Digest))
		// }

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}
