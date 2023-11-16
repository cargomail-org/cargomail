package api

import (
	"cargomail/cmd/mailbox/api/helper"
	"cargomail/internal/mailbox/agent"
	"cargomail/internal/mailbox/repository"
	"cargomail/internal/mailbox/storage"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

type DraftsApi struct {
	useDraftRepository      repository.UseDraftRepository
	useDraftStorage         storage.UseDraftStorage
	useMessageTransferAgent agent.UseMessageTransferAgent
}

func (api *DraftsApi) Create() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var draft *repository.Draft

		err := helper.Decoder(r.Body).Decode(&draft)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		draft, err = api.useDraftStorage.Create(user, draft)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusCreated, draft)
	})
}

func (api *DraftsApi) List() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		draftList, err := api.useDraftStorage.List(user)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, draftList)
	})
}

func (api *DraftsApi) Sync() http.Handler {
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

		draftHistory, err := api.useDraftStorage.Sync(user, history)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, draftHistory)
	})
}

func (api *DraftsApi) Update() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var draft *repository.Draft

		err := helper.Decoder(r.Body).Decode(&draft)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if draft.Id == "" {
			http.Error(w, repository.ErrMissingIdField.Error(), http.StatusBadRequest)
			return
		}

		if draft.Payload == nil {
			http.Error(w, repository.ErrMissingPayloadField.Error(), http.StatusBadRequest)
			return
		}

		if draft.Payload.Headers == nil {
			http.Error(w, repository.ErrMissingHeadersField.Error(), http.StatusBadRequest)
			return
		}

		draft, err = api.useDraftStorage.Update(user, draft)
		if err != nil {
			switch {
			case errors.Is(err, repository.ErrDraftNotFound):
				helper.ReturnErr(w, err, http.StatusNotFound)
			default:
				helper.ReturnErr(w, err, http.StatusInternalServerError)
			}
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, draft)
	})
}

func (api *DraftsApi) Trash() http.Handler {
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

		err = api.useDraftRepository.Trash(user, idsString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *DraftsApi) Untrash() http.Handler {
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

		err = api.useDraftRepository.Untrash(user, idsString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *DraftsApi) Delete() http.Handler {
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

		err = api.useDraftRepository.Delete(user, idsString)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *DraftsApi) Submit() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var draft *repository.Draft

		err := helper.Decoder(r.Body).Decode(&draft)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if draft.Id == "" {
			http.Error(w, repository.ErrMissingIdField.Error(), http.StatusBadRequest)
			return
		}

		if draft.Payload == nil {
			http.Error(w, repository.ErrMissingPayloadField.Error(), http.StatusBadRequest)
			return
		}

		if draft.Payload.Headers == nil {
			http.Error(w, repository.ErrMissingHeadersField.Error(), http.StatusBadRequest)
			return
		}

		message, err := api.useDraftRepository.Submit(user, draft)
		if err != nil {
			recipientsNotFoundError := &repository.RecipientsNotFoundError{}

			switch {
			case errors.As(err, &recipientsNotFoundError):
				warning := recipientsNotFoundError.Err.Error() + ": " + strings.Join(recipientsNotFoundError.Recipients, ", ")
				w.Header().Set("X-Warning", string(warning))
				goto ok
			case errors.Is(err, repository.ErrDraftNotFound):
				helper.ReturnErr(w, err, http.StatusNotFound)
			default:
				helper.ReturnErr(w, err, http.StatusInternalServerError)
			}
			return
		}
	ok:
		// TODO post the placeholder message to the mail service
		//
		// api.useMessageTransferAgent.Submit()

		helper.SetJsonResponse(w, http.StatusOK, message)
	})
}
