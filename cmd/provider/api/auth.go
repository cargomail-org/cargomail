package api

import (
	"cargomail/cmd/provider/api/helper"
	"cargomail/internal/config"
	"net/http"
)

type AuthApi struct {
}

func (api *AuthApi) Info() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		domainName := struct {
			DomainName string `json:"domainName"`
		}{
			DomainName: config.Configuration.DomainName,
		}

		helper.SetJsonResponse(w, http.StatusOK, domainName)
	})
}
