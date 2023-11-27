package api

import (
	"cargomail/cmd/mail/api/helper"
	"cargomail/internal/mailbox/repository"
	"cargomail/internal/shared/config"
	"net/http"
)

type AuthApi struct {
}

func (api *AuthApi) Info() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var info interface{}

		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)

		if ok {
			protocol := "https://"

			if config.DevStage() {
				protocol = "http://"
			}

			info = struct {
				DomainName        string `json:"domainName"`
				Username          string `json:"username"`
				MailboxServiceURL string `json:"mailboxServiceURL"`
			}{
				DomainName:        config.Configuration.DomainName,
				Username:          user.Username,
				MailboxServiceURL: protocol + config.Configuration.RHSBind,
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
