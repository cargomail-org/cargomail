package api

import (
	"cargomail/internal/config"
	"net/http"
)

type HealthApi struct {
}

func (api *HealthApi) Healthcheck() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(config.Configuration.DomainName))
	})
}
