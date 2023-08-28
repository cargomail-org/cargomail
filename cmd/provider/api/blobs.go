package api

import (
	"cargomail/cmd/provider/api/helper"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"crypto/sha256"
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

type BlobsApi struct {
	blobs repository.BlobRepository
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

			if r.Method == "PUT" {
				blob, err := api.blobs.GetBlobByUri(user, files[i].Filename)
				if err != nil {
					helper.ReturnErr(w, err, http.StatusNotFound)
					return
				}

				if len(blob.Uri) > 0 {
					f, err := os.OpenFile(filepath.Join(blobsPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
					if err != nil {
						fmt.Println(err)
						return
					}
					defer f.Close()

					hash := sha256.New()
					written, err := io.Copy(f, io.TeeReader(file, hash))
					if err != nil {
						helper.ReturnErr(w, err, http.StatusInternalServerError)
						return
					}

					hashSum := hash.Sum(nil)
					hashStr := fmt.Sprintf("%x", hashSum)

					contentType := files[i].Header.Get("content-type")

					uploadedBlob = &repository.Blob{
						Uri:         blob.Uri,
						Hash:        hashStr,
						Size:        written,
						ContentType: contentType,
					}

					uploadedBlob, err = api.blobs.Update(user, uploadedBlob)
					if err != nil {
						switch {
						case errors.Is(err, repository.ErrBlobNotFound):
							helper.ReturnErr(w, err, http.StatusNotFound)
						default:
							helper.ReturnErr(w, err, http.StatusInternalServerError)
						}
						return
					}

					os.Rename(filepath.Join(blobsPath, uuid), filepath.Join(blobsPath, uploadedBlob.Uri))
					if err != nil {
						helper.ReturnErr(w, err, http.StatusInternalServerError)
						return
					}
				}
			} else {
				f, err := os.OpenFile(filepath.Join(blobsPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
				if err != nil {
					fmt.Println(err)
					return
				}
				defer f.Close()

				hash := sha256.New()
				written, err := io.Copy(f, io.TeeReader(file, hash))
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}

				hashSum := hash.Sum(nil)
				hashStr := fmt.Sprintf("%x", hashSum)

				contentType := files[i].Header.Get("content-type")

				uploadedBlob = &repository.Blob{
					Hash:        hashStr,
					Name:        files[i].Filename,
					Size:        written,
					ContentType: contentType,
				}

				uploadedBlob, err = api.blobs.Create(user, uploadedBlob)
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}

				os.Rename(filepath.Join(blobsPath, uuid), filepath.Join(blobsPath, uploadedBlob.Uri))
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}
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

		uri := path.Base(r.URL.Path)

		blob, err := api.blobs.GetBlobByUri(user, uri)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		if len(blob.Uri) == 0 {
			helper.ReturnErr(w, repository.ErrBlobNotFound, http.StatusNotFound)
			return
		}

		if r.Method == "HEAD" {
			w.WriteHeader(http.StatusOK)
		} else if r.Method == "GET" {
			asciiBlobUri, err := helper.ToAscii(blob.Uri)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			urlEncodedBlobUri, err := url.Parse(blob.Uri)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

			blobPath := filepath.Join(blobsPath, uri)
			w.Header().Set("Content-Type", blob.ContentType)
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q; filename*=UTF-8''%s", asciiBlobUri, urlEncodedBlobUri))

			blobPath = filepath.Clean(blobPath)

			http.ServeFile(w, r, blobPath)
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

		blobList, err := api.blobs.List(user)
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

		err := json.NewDecoder(r.Body).Decode(&history)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		blobSync, err := api.blobs.Sync(user, history)
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

		var uris repository.Uris

		err := json.NewDecoder(r.Body).Decode(&uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if uris.Uris == nil {
			http.Error(w, repository.ErrMissingUrisField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		urisString := string(body)

		err = api.blobs.Trash(user, urisString)
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

		var uris repository.Uris

		err := json.NewDecoder(r.Body).Decode(&uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if uris.Uris == nil {
			http.Error(w, repository.ErrMissingUrisField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		urisString := string(body)

		err = api.blobs.Untrash(user, urisString)
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

		var uris repository.Uris

		err := json.NewDecoder(r.Body).Decode(&uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if uris.Uris == nil {
			http.Error(w, repository.ErrMissingUrisField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		urisString := string(body)

		err = api.blobs.Delete(user, urisString)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

		var blobList []string

		err = json.Unmarshal(body, &blobList)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		for _, uuid := range blobList {
			_ = os.Remove(filepath.Join(blobsPath, uuid))
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}
