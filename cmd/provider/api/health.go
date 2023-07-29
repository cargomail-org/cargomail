package api

import "net/http"

type HealthApi struct {
	domainName string
}

func (api *HealthApi) Healthcheck() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(api.domainName))
	})
}
