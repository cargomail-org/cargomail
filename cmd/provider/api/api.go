package api

import (
	"cargomail/cmd/provider/api/helper"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"context"
	"errors"
	"net/http"
	"time"
)

type ApiParams struct {
	Repository repository.Repository
}

type Api struct {
	Health   HealthApi
	Blobs   BlobsApi
	Files    FilesApi
	Auth     AuthApi
	Session  SessionApi
	User     UserApi
	Contacts ContactsApi
	Drafts   DraftsApi
	Messages MessagesApi
}

func NewApi(params ApiParams) Api {
	return Api{
		Health:   HealthApi{},
		Blobs:   BlobsApi{blobs: params.Repository.Blobs},
		Files:    FilesApi{files: params.Repository.Files},
		Auth:     AuthApi{},
		Session:  SessionApi{user: params.Repository.User, session: params.Repository.Session},
		User:     UserApi{user: params.Repository.User},
		Contacts: ContactsApi{contacts: params.Repository.Contacts},
		Drafts:   DraftsApi{drafts: params.Repository.Drafts},
		Messages: MessagesApi{messages: params.Repository.Messages},
	}
}

func (api *Api) contextSetUser(r *http.Request, user *repository.User) *http.Request {
	ctx := context.WithValue(r.Context(), repository.UserContextKey, user)
	return r.WithContext(ctx)
}

// middleware
func (api *Api) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionCookie, err := r.Cookie("sessionUri")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				http.Error(w, "cookie not found", http.StatusBadRequest)
			default:
				http.Error(w, "server error", http.StatusInternalServerError)
			}
			return
		}

		sessionUri := sessionCookie.Value

		// TODO magic number!
		if len(sessionUri) != 32 {
			helper.ReturnErr(w, repository.ErrInvalidOrMissingSession, http.StatusForbidden)
			return
		}

		user, err := api.User.user.GetBySession(repository.ScopeAuthentication, sessionUri)
		if err != nil {
			switch {
			case errors.Is(err, repository.ErrUsernameNotFound):
				helper.ReturnErr(w, repository.ErrInvalidCredentials, http.StatusForbidden)
			default:
				helper.ReturnErr(w, err, http.StatusInternalServerError)
			}
			return
		}

		var deviceId string

		deviceIdCookie, err := r.Cookie("deviceId")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				// nothing to do
			default:
				http.Error(w, "server error", http.StatusInternalServerError)
				return
			}
		} else {
			deviceId = deviceIdCookie.Value
		}

		user.DeviceId = &deviceId

		r = api.contextSetUser(r, user)

		// refresh sessionUri/deviceId cookies

		ttl := config.DefaultSessionTTL
		sessionCookie.Expires = time.Now().Add(ttl)
		sessionCookie.Path = "/"

		updated, err := api.Session.session.UpdateIfOlderThan5Minutes(user, sessionCookie.Value, sessionCookie.Expires)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		if updated {
			http.SetCookie(w, sessionCookie)

			if len(deviceId) > 0 {
				deviceIdCookie.Expires = time.Now().AddDate(1, 0, 0) // 1 year
				deviceIdCookie.Path = "/"

				http.SetCookie(w, deviceIdCookie)
			}
		}

		next.ServeHTTP(w, r)
	})
}
