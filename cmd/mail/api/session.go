package api

import (
	"cargomail/cmd/mail/api/helper"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

type SessionApi struct {
	useUserRepository    repository.UseUserRepository
	useSessionRepository repository.UseSessionRepository
}

type credentials struct {
	Username   string `json:"username"`
	Password   string `json:"password"`
	RememberMe bool   `json:"rememberMe"`
}

func isAlnumOrHyphenOrDot(s string) bool {
	for _, r := range s {
		if (r < 'a' || r > 'z') && (r < 'A' || r > 'Z') && (r < '0' || r > '9') && r != '-' && r != '.' {
			return false
		}
	}
	return true
}

func validCredentials(c credentials) bool {
	return len(c.Username) <= 40 &&
		len(c.Username) > 0 &&
		!strings.HasPrefix(c.Username, "-") &&
		!strings.Contains(c.Username, "--") &&
		!strings.HasSuffix(c.Username, "-") &&
		!strings.HasPrefix(c.Username, ".") &&
		!strings.Contains(c.Username, "..") &&
		!strings.HasSuffix(c.Username, ".") &&
		isAlnumOrHyphenOrDot(c.Username) &&
		len(c.Password) <= 40 &&
		len(c.Password) > 0
}

func (api *UserApi) Register() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var input credentials

		helper.FromJson(r.Body, &input)

		if !validCredentials(input) {
			helper.ReturnErr(w, repository.ErrInvalidCredentials, http.StatusForbidden)
			return
		}

		user := &repository.User{
			Username: input.Username,
		}

		err := user.Password.Set(input.Password)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		err = api.useUserRepository.Create(user)
		if err != nil {
			switch {
			case errors.Is(err, repository.ErrUsernameAlreadyTaken):
				helper.ReturnErr(w, err, http.StatusForbidden)
			default:
				helper.ReturnErr(w, err, http.StatusInternalServerError)
			}
			return
		}

		helper.SetJsonResponse(w, http.StatusCreated, user)
	})
}

func (api *SessionApi) Login() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var input credentials

		helper.FromJson(r.Body, &input)

		if !validCredentials(input) {
			helper.ReturnErr(w, repository.ErrInvalidCredentials, http.StatusForbidden)
			return
		}

		user, err := api.useUserRepository.GetByUsername(input.Username)
		if err != nil {
			switch {
			case errors.Is(err, repository.ErrUsernameNotFound):
				helper.ReturnErr(w, err, http.StatusForbidden)
			default:
				helper.ReturnErr(w, err, http.StatusInternalServerError)
			}
			return
		}

		match, err := user.Password.Matches(input.Password)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		if !match {
			helper.ReturnErr(w, repository.ErrInvalidCredentials, http.StatusForbidden)
			return
		}

		ttl := config.DefaultSessionTTL
		session, err := api.useSessionRepository.New(user.Id, ttl, repository.ScopeAuthentication)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		sessionCookie := http.Cookie{
			Name:     "sessionId",
			Value:    session.Id,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: config.CookieSameSite(),
		}

		if input.RememberMe {
			sessionCookie.Expires = session.Expiry
		}

		http.SetCookie(w, &sessionCookie)

		var deviceId string

		deviceIdCookie, err := r.Cookie("deviceId")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				deviceId = strings.Replace(uuid.NewString(), "-", "", -1)
			default:
				http.Error(w, "server error", http.StatusInternalServerError)
				return
			}
		} else {
			deviceId = deviceIdCookie.Value
		}

		deviceIdCookie = &http.Cookie{
			Name:     "deviceId",
			Value:    deviceId,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: config.CookieSameSite(),
			Expires:  time.Now().AddDate(1, 0, 0), // 1 year
		}

		http.SetCookie(w, deviceIdCookie)

		helper.SetJsonResponse(w, http.StatusOK, session)
	})
}

func (api *SessionApi) Logout() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		clearCookie := http.Cookie{
			Name:     "sessionId",
			Value:    "",
			MaxAge:   -1,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: config.CookieSameSite(),
		}
		http.SetCookie(w, &clearCookie)

		cookie, err := r.Cookie("sessionId")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				http.Error(w, "cookie not found", http.StatusBadRequest)
			default:
				http.Error(w, "server error", http.StatusInternalServerError)
			}
			return
		}

		sessionId := cookie.Value

		err = api.useSessionRepository.Remove(user, sessionId)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
	})
}
