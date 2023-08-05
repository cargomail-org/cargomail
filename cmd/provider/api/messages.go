package api

import (
	"cargomail/cmd/provider/api/helper"
	"cargomail/internal/repository"
	"net/http"
)

type MessagesApi struct {
	messages repository.MessagesRepository
}

func (api *MessagesApi) GetAll() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		messageHistory, err := api.messages.GetAll(user)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, messageHistory)
	})
}
