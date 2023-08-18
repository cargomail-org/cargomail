package app

import (
	"cargomail/cmd/provider/api/helper"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"context"
	"embed"
	"errors"
	"net/http"
)

type AppParams struct {
	Repository repository.Repository
	Files      embed.FS
}

type App struct {
	repository repository.Repository
	files      embed.FS
}

func NewApp(params AppParams) App {
	return App{
		repository: params.Repository,
		files:      params.Files,
	}
}

func (app *App) contextSetUser(r *http.Request, user *repository.User) *http.Request {
	ctx := context.WithValue(r.Context(), repository.UserContextKey, user)
	return r.WithContext(ctx)
}

func redirectToLoginPage(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/login.html", http.StatusSeeOther)
}

// middleware
func (app *App) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionCookie, err := r.Cookie("sessionUri")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				redirectToLoginPage(w, r)
			default:
				http.Error(w, "server error", http.StatusInternalServerError)
			}
			return
		}

		sessionUri := sessionCookie.Value

		// TODO magic number!
		if len(sessionUri) != 32 {
			redirectToLoginPage(w, r)
			return
		}

		user, err := app.repository.User.GetBySession(repository.ScopeAuthentication, sessionUri)
		if err != nil {
			switch {
			case errors.Is(err, repository.ErrUsernameNotFound):
				redirectToLoginPage(w, r)
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

		r = app.contextSetUser(r, user)

		next.ServeHTTP(w, r)
	})
}

func (app *App) Logout() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		clearCookie := http.Cookie{
			Name:     "sessionUri",
			Value:    "",
			MaxAge:   -1,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: config.CookieSameSite(),
		}
		http.SetCookie(w, &clearCookie)

		// authorizationHeader := r.Header.Get("Authorization")

		// headerParts := strings.Split(authorizationHeader, " ")
		// if len(headerParts) != 2 || headerParts[0] != "Bearer" {
		// 	helper.ReturnErr(w, repository.ErrInvalidOrMissingAuthToken, http.StatusForbidden)
		// 	return
		// }

		// token := headerParts[1]

		cookie, err := r.Cookie("sessionUri")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				redirectToLoginPage(w, r)
			default:
				redirectToLoginPage(w, r)
			}
			return
		}

		sessionUri := cookie.Value

		err = app.repository.Session.Remove(user, sessionUri)
		if err != nil {
			redirectToLoginPage(w, r)
			return
		}

		redirectToLoginPage(w, r)
	})
}
