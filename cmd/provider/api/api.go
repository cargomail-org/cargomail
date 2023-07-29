package api

import (
	"cargomail/cmd/provider/api/helper"
	"cargomail/internal/repository"
	"context"
	"errors"
	"log"
	"net/http"
)

type ApiParams struct {
	DomainName string
	FilesPath  string
	Repository repository.Repository
}

type Api struct {
	Health   HealthApi
	Files    FilesApi
	Session  SessionApi
	User     UserApi
	Contacts ContactsApi
}

func NewApi(params ApiParams) Api {
	return Api{
		Health:   HealthApi{domainName: params.DomainName},
		Files:    FilesApi{files: params.Repository.Files, filesPath: params.FilesPath},
		Session:  SessionApi{user: params.Repository.User, session: params.Repository.Session},
		User:     UserApi{user: params.Repository.User},
		Contacts: ContactsApi{contacts: params.Repository.Contacts},
	}
}

func (api *Api) contextSetUser(r *http.Request, user *repository.User) *http.Request {
	ctx := context.WithValue(r.Context(), repository.UserContextKey, user)
	return r.WithContext(ctx)
}

// middleware
func (api *Api) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// w.Header().Add("Vary", "Authorization")

		// authorizationHeader := r.Header.Get("Authorization")

		// headerParts := strings.Split(authorizationHeader, " ")
		// if len(headerParts) != 2 || headerParts[0] != "Bearer" {
		// 	helper.ReturnErr(w, repository.ErrInvalidOrMissingAuthToken, http.StatusForbidden)
		// 	return
		// }

		// token := headerParts[1]

		sessionCookie, err := r.Cookie("session")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				http.Error(w, "cookie not found", http.StatusBadRequest)
			default:
				log.Println(err)
				http.Error(w, "server error", http.StatusInternalServerError)
			}
			return
		}

		session := sessionCookie.Value

		// TODO magic number!
		if len(session) != 52 {
			helper.ReturnErr(w, repository.ErrInvalidOrMissingSession, http.StatusForbidden)
			return
		}

		user, err := api.User.user.GetBySession(repository.ScopeAuthentication, session)
		if err != nil {
			switch {
			case errors.Is(err, repository.ErrUsernameNotFound):
				helper.ReturnErr(w, repository.ErrInvalidCredentials, http.StatusForbidden)
			default:
				helper.ReturnErr(w, err, http.StatusInternalServerError)
			}
			return
		}

		var device_id string

		deviceIdCookie, err := r.Cookie("device_id")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				// nothing to do
			default:
				log.Println(err)
				http.Error(w, "server error", http.StatusInternalServerError)
				return
			}
		} else {
			device_id = deviceIdCookie.Value
		}

		user.DeviceId = &device_id

		r = api.contextSetUser(r, user)

		next.ServeHTTP(w, r)
	})
}
