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

type BodiesApi struct {
	bodies repository.BodyRepository
}

func (api *BodiesApi) Upload() http.Handler {
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

		uploadedBodies := []*repository.Body{}

		files := r.MultipartForm.File["bodies"]
		for i := range files {
			file, err := files[i].Open()
			if err != nil {
				fmt.Println(err)
				return
			}
			defer file.Close()

			bodiesPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BodiesFolder)

			if _, err := os.Stat(bodiesPath); errors.Is(err, os.ErrNotExist) {
				err := os.MkdirAll(bodiesPath, os.ModePerm)
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}
			}

			uuid := uuid.NewString()

			f, err := os.OpenFile(filepath.Join(bodiesPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
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
			uri := fmt.Sprintf("%x", hashSum)

			contentType := files[i].Header.Get("content-type")

			uploadedBody := &repository.Body{
				Uri:         uri,
				Name:        files[i].Filename,
				Size:        written,
				ContentType: contentType,
			}

			uploadedBody, err = api.bodies.Create(user, uploadedBody)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			os.Rename(filepath.Join(bodiesPath, uuid), filepath.Join(bodiesPath, uploadedBody.Id))
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			uploadedBodies = append(uploadedBodies, uploadedBody)
		}

		helper.SetJsonResponse(w, http.StatusCreated, uploadedBodies)
	})
}

func (api *BodiesApi) Download() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		id := path.Base(r.URL.Path)

		bodyName, err := api.bodies.GetName(user, id)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusNotFound)
			return
		}

		if r.Method == "HEAD" {
			w.WriteHeader(http.StatusOK)
		} else if r.Method == "GET" {
			asciiBodyName, err := helper.ToAscii(bodyName)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			urlEncodedBodyName, err := url.Parse(bodyName)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			bodiesPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BodiesFolder)

			bodyPath := filepath.Join(bodiesPath, id)
			w.Header().Set("Content-Type", "application/octet-stream")
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q; filename*=UTF-8''%s", asciiBodyName, urlEncodedBodyName))
			http.ServeFile(w, r, bodyPath)
		}
	})
}

func (api *BodiesApi) List() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		bodyList, err := api.bodies.List(user)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, bodyList)
	})
}

func (api *BodiesApi) Sync() http.Handler {
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

		bodySync, err := api.bodies.Sync(user, history)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, bodySync)
	})
}

func (api *BodiesApi) Trash() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		bodyString := string(body)

		err = api.bodies.Trash(user, bodyString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *BodiesApi) Untrash() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		bodyString := string(body)

		err = api.bodies.Untrash(user, bodyString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *BodiesApi) Delete() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		bodyString := string(body)

		err = api.bodies.Delete(user, bodyString)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		bodiesPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BodiesFolder)

		var bodyList []string

		err = json.Unmarshal(body, &bodyList)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		for _, uuid := range bodyList {
			_ = os.Remove(filepath.Join(bodiesPath, uuid))
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}
