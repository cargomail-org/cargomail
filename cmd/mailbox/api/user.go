package api

import (
	"cargomail/cmd/mailbox/api/helper"
	"cargomail/internal/repository"
	"errors"
	"net/http"
)

type UserApi struct {
	userDepository repository.UserDepository
}

func (api *UserApi) Profile() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}
		if r.Method == "PUT" {
			err := helper.Decoder(r.Body).Decode(&user)
			if err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			profile, err := api.userDepository.UpdateProfile(user)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			helper.SetJsonResponse(w, http.StatusOK, profile)
		} else if r.Method == "GET" {
			profile, err := api.userDepository.GetProfile(user.Username)
			if err != nil {
				switch {
				case errors.Is(err, repository.ErrUsernameNotFound):
					helper.ReturnErr(w, err, http.StatusForbidden)
				default:
					helper.ReturnErr(w, err, http.StatusInternalServerError)
				}
				return
			}

			helper.SetJsonResponse(w, http.StatusOK, profile)
		}
	})
}
