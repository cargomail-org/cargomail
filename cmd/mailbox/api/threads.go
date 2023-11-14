package api

import (
	"cargomail/cmd/mailbox/api/helper"
	"cargomail/internal/mailbox/repository"
	"encoding/json"
	"net/http"
)

type ThreadsApi struct {
	useThreadRepository repository.UseThreadRepository
}

func (api *ThreadsApi) List() http.Handler {
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

		threadHistory, err := api.useThreadRepository.List(user, folder.Folder)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, threadHistory)
	})
}

func (api *ThreadsApi) Trash() http.Handler {
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

		err = api.useThreadRepository.Trash(user, idsString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *ThreadsApi) Untrash() http.Handler {
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

		err = api.useThreadRepository.Untrash(user, idsString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *ThreadsApi) Delete() http.Handler {
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

		err = api.useThreadRepository.Delete(user, idsString)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}
