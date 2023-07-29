package api

import (
	"cargomail/cmd/provider/api/helper"
	"cargomail/internal/repository"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"unicode"

	"github.com/google/uuid"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

type FilesApi struct {
	files     repository.FilesRepository
	filesPath string
}

func ToAscii(str string) (string, error) {
	result, _, err := transform.String(transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn))), str)
	if err != nil {
		return "", err
	}
	return result, nil
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
			log.Println(err)
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

			filePath := api.filesPath

			if _, err := os.Stat(filePath); errors.Is(err, os.ErrNotExist) {
				err := os.MkdirAll(filePath, os.ModePerm)
				if err != nil {
					log.Println(err)
					return
				}
			}

			uuid := uuid.NewString()

			f, err := os.OpenFile(filepath.Join(filePath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
			if err != nil {
				fmt.Println(err)
				return
			}
			defer f.Close()

			hash := sha256.New()
			written, err := io.Copy(f, io.TeeReader(file, hash))
			if err != nil {
				log.Println(err)
				return
			}

			hashSum := hash.Sum(nil)
			checksum := fmt.Sprintf("%x", hashSum)

			contentType := files[i].Header.Get("content-type")

			uploadedFile := &repository.File{
				Checksum:    checksum,
				Name:        files[i].Filename,
				Size:        written,
				ContentType: contentType,
			}

			uploadedFile, err = api.files.Create(user, uploadedFile)
			if err != nil {
				log.Println(err)
				return
			}

			os.Rename(filepath.Join(filePath, uuid), filepath.Join(filePath, uploadedFile.Id))
			if err != nil {
				log.Println(err)
				return
			}

			uploadedFiles = append(uploadedFiles, uploadedFile)
		}

		helper.SetJsonResponse(w, http.StatusCreated, uploadedFiles)
	})
}

func (api *FilesApi) Download() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		id := path.Base(r.URL.Path)

		fileName, err := api.files.GetOriginalFileName(user, id)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusNotFound)
			return
		}

		if r.Method == "HEAD" {
			w.WriteHeader(http.StatusOK)
		} else if r.Method == "GET" {
			asciiFileName, err := ToAscii(fileName)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			urlEncodedFileName, err := url.Parse(fileName)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			filePath := filepath.Join(api.filesPath, id)
			w.Header().Set("Content-Type", "application/octet-stream")
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q; filename*=UTF-8''%s", asciiFileName, urlEncodedFileName))
			http.ServeFile(w, r, filePath)
		}
	})
}

func (api *FilesApi) GetAll() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		fileHistory, err := api.files.GetAll(user)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, fileHistory)
	})
}

func (api *FilesApi) GetHistory() http.Handler {
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

		fileHistory, err := api.files.GetHistory(user, history)
		if err != nil {
			log.Println(err)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, fileHistory)
	})
}

func (api *FilesApi) TrashByIdList() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			log.Println(err)
			return
		}

		bodyString := string(body)

		err = api.files.TrashByIdList(user, bodyString)
		if err != nil {
			log.Println(err)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *FilesApi) UntrashByIdList() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			log.Println(err)
			return
		}

		bodyString := string(body)

		err = api.files.UntrashByIdList(user, bodyString)
		if err != nil {
			log.Println(err)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *FilesApi) DeleteByIdList() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			log.Println(err)
			return
		}

		bodyString := string(body)

		err = api.files.DeleteByIdList(user, bodyString)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		filepath := api.filesPath

		var bodyList []string

		err = json.Unmarshal(body, &bodyList)
		if err != nil {
			log.Println(err)
			return
		}

		for _, uuid := range bodyList {
			_ = os.Remove(filepath + uuid)
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}
