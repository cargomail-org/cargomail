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
	"os"
	"path"
	"path/filepath"

	"github.com/google/uuid"
)

type BlobsApi struct {
	useBlobRepository repository.UseBlobRepository
	useBlobStorage    storage.UseBlobStorage
}

func (api *BlobsApi) Upload() http.Handler {
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

		uploadedBlobs := []*repository.Blob{}

		files := r.MultipartForm.File["blobs"]
		for i := range files {
			file, err := files[i].Open()
			if err != nil {
				fmt.Println(err)
				return
			}
			defer file.Close()

			blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

			if _, err := os.Stat(blobsPath); errors.Is(err, os.ErrNotExist) {
				err := os.MkdirAll(blobsPath, os.ModePerm)
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}
			}

			uuid := uuid.NewString()

			uploadedBlob := &repository.Blob{}

			uploadedBlob, err = api.useBlobStorage.Store(user, file, blobsPath, uuid, files[i].Filename, files[i].Header.Get("content-type"))
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			if uploadedBlob != nil && (repository.Blob{}) != *uploadedBlob {
				uploadedBlobs = append(uploadedBlobs, uploadedBlob)
			}
		}

		if len(uploadedBlobs) > 0 {
			helper.SetJsonResponse(w, http.StatusCreated, uploadedBlobs)
		} else {
			helper.SetJsonResponse(w, http.StatusOK, uploadedBlobs)
		}
	})
}

func (api *BlobsApi) Download() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		digest := path.Base(r.URL.Path)

		blob, err := api.useBlobRepository.GetByDigest(user, digest)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		if len(blob.Digest) == 0 {
			helper.ReturnErr(w, repository.ErrBlobNotFound, http.StatusNotFound)
			return
		}

		if r.Method == "HEAD" {
			w.WriteHeader(http.StatusOK)
		} else if r.Method == "GET" {
			blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)
			blobPath := filepath.Join(blobsPath, digest)

			w.Header().Set("Content-Type", blob.ContentType)
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q; filename*=UTF-8''%s", digest, digest))

			blobPath = filepath.Clean(blobPath)

			err = api.useBlobStorage.Load(w, blob, blobPath)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}
		}
	})
}

func (api *BlobsApi) List() http.Handler {
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

		blobList, err := api.useBlobRepository.List(user, folder.Folder)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, blobList)
	})
}

func (api *BlobsApi) Sync() http.Handler {
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

		blobSync, err := api.useBlobRepository.Sync(user, history)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, blobSync)
	})
}

func (api *BlobsApi) Trash() http.Handler {
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

		err = api.useBlobRepository.Trash(user, idsString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *BlobsApi) Untrash() http.Handler {
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

		err = api.useBlobRepository.Untrash(user, idsString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *BlobsApi) Delete() http.Handler {
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

		_, err = api.useBlobRepository.Delete(user, idsString)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		//TODO remove if no reference

		// blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

		// for _, blob := range *blobs {
		// 	_ = os.Remove(filepath.Join(blobsPath, blob.Digest))
		// }

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}
