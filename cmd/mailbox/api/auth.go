package api

import (
	"cargomail/cmd/mailbox/api/helper"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"net/http"
)

type AuthApi struct {
}

func (api *AuthApi) Info() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var info interface{}

		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)

		if ok {
			info = struct {
				DomainName string `json:"domainName"`
				Username   string `json:"username"`
			}{
				DomainName: config.Configuration.DomainName,
				Username:   user.Username,
			}
		} else {
			info = struct {
				DomainName string `json:"domainName"`
			}{
				DomainName: config.Configuration.DomainName,
			}
		}

		helper.SetJsonResponse(w, http.StatusOK, info)
	})
}
