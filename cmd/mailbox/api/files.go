package api

import (
	"cargomail/cmd/mailbox/api/helper"
	"cargomail/internal/mailbox/repository"
	"cargomail/internal/mailbox/storage"
	"cargomail/internal/shared/config"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"

	"github.com/google/uuid"
)

type FilesApi struct {
	useFileRepository repository.UseFileRepository
	useFileStorage    storage.UseFileStorage
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

			uploadedFile, err := api.useFileStorage.Store(user, file, filesPath, uuid, files[i].Filename, files[i].Header.Get("content-type"))
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

		file, err := api.useFileRepository.GetByDigest(user, digest)
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

			err = api.useFileStorage.Load(w, file, filePath)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
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

		fileList, err := api.useFileRepository.List(user, folder.Folder)
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

		fileSync, err := api.useFileRepository.Sync(user, history)
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

		err = api.useFileRepository.Trash(user, idsString)
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

		err = api.useFileRepository.Untrash(user, idsString)
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

		_, err = api.useFileRepository.Delete(user, idsString)
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
