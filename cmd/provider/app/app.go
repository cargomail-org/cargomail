package app

import (
	"cargomail/cmd/provider/api/helper"
	"cargomail/internal/repository"
	"context"
	"errors"
	"html/template"
	"log"
	"net/http"
)

type AppParams struct {
	DomainName       string
	Repository       repository.Repository
	HomeTemplate     *template.Template
	LoginTemplate    *template.Template
	RegisterTemplate *template.Template
}

type App struct {
	domainName       string
	repository       repository.Repository
	HomeTemplate     *template.Template
	LoginTemplate    *template.Template
	RegisterTemplate *template.Template
}

func NewApp(params AppParams) App {
	return App{
		domainName:       params.DomainName,
		repository:       params.Repository,
		HomeTemplate:     params.HomeTemplate,
		LoginTemplate:    params.LoginTemplate,
		RegisterTemplate: params.RegisterTemplate,
	}
}

func (app *App) contextSetUser(r *http.Request, user *repository.User) *http.Request {
	ctx := context.WithValue(r.Context(), repository.UserContextKey, user)
	return r.WithContext(ctx)
}

func redirectToLoginPage(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/login", http.StatusSeeOther)
}

// middleware
func (app *App) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionCookie, err := r.Cookie("session")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				redirectToLoginPage(w, r)
			default:
				log.Println(err)
				http.Error(w, "server error", http.StatusInternalServerError)
			}
			return
		}

		session := sessionCookie.Value

		// TODO magic number!
		if len(session) != 52 {
			redirectToLoginPage(w, r)
			return
		}

		user, err := app.repository.User.GetBySession(repository.ScopeAuthentication, session)
		if err != nil {
			switch {
			case errors.Is(err, repository.ErrUsernameNotFound):
				redirectToLoginPage(w, r)
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

		r = app.contextSetUser(r, user)

		next.ServeHTTP(w, r)
	})
}

func (app *App) Logout() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clearCookie := http.Cookie{
			Name:     "session",
			Value:    "",
			MaxAge:   -1,
			Path:     "/",
			HttpOnly: true,
			Secure:   false, // !!!
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, &clearCookie)

		// authorizationHeader := r.Header.Get("Authorization")

		// headerParts := strings.Split(authorizationHeader, " ")
		// if len(headerParts) != 2 || headerParts[0] != "Bearer" {
		// 	helper.ReturnErr(w, repository.ErrInvalidOrMissingAuthToken, http.StatusForbidden)
		// 	return
		// }

		// token := headerParts[1]

		cookie, err := r.Cookie("session")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				redirectToLoginPage(w, r)
			default:
				log.Println(err)
				redirectToLoginPage(w, r)
			}
			return
		}

		session := cookie.Value

		err = app.repository.Session.Remove(session)
		if err != nil {
			redirectToLoginPage(w, r)
			return
		}

		redirectToLoginPage(w, r)
	})
}
