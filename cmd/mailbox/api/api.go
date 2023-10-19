package api

import (
	"cargomail/cmd/mailbox/api/helper"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"cargomail/internal/storage"
	"context"
	"errors"
	"net/http"
	"time"
)

type ApiParams struct {
	Repository repository.Repository
	Storage    storage.Storage
}

type Api struct {
	Health   HealthApi
	Blobs    BlobsApi
	Files    FilesApi
	Auth     AuthApi
	Session  SessionApi
	User     UserApi
	Contacts ContactsApi
	Drafts   DraftsApi
	Messages MessagesApi
	Threads  ThreadsApi
}

func NewApi(params ApiParams) Api {
	return Api{
		Health:   HealthApi{},
		Blobs:    BlobsApi{blobDepository: params.Repository.Blobs, blobStore: params.Storage.Blobs},
		Files:    FilesApi{fileDepository: params.Repository.Files, fileStore: params.Storage.Files},
		Auth:     AuthApi{},
		Session:  SessionApi{userDepository: params.Repository.User, sessionDepository: params.Repository.Session},
		User:     UserApi{userDepository: params.Repository.User},
		Contacts: ContactsApi{contactDepository: params.Repository.Contacts},
		Drafts:   DraftsApi{draftDepository: params.Repository.Drafts},
		Messages: MessagesApi{messageDepository: params.Repository.Messages},
		Threads:  ThreadsApi{threadDepository: params.Repository.Threads},
	}
}

func (api *Api) contextSetUser(r *http.Request, user *repository.User) *http.Request {
	ctx := context.WithValue(r.Context(), repository.UserContextKey, user)
	return r.WithContext(ctx)
}

// middleware
func (api *Api) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionCookie, err := r.Cookie("sessionId")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				http.Error(w, "cookie not found", http.StatusBadRequest)
			default:
				http.Error(w, "server error", http.StatusInternalServerError)
			}
			return
		}

		sessionId := sessionCookie.Value

		// TODO magic number!
		if len(sessionId) != 32 {
			helper.ReturnErr(w, repository.ErrInvalidOrMissingSession, http.StatusForbidden)
			return
		}

		user, err := api.User.userDepository.GetBySession(repository.ScopeAuthentication, sessionId)
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

		// refresh sessionId/deviceId cookies

		ttl := config.DefaultSessionTTL
		sessionCookie.Expires = time.Now().Add(ttl)
		sessionCookie.Path = "/"

		updated, err := api.Session.sessionDepository.UpdateIfOlderThan5Minutes(user, sessionCookie.Value, sessionCookie.Expires)
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
