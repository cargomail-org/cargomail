package app

import (
	"cargomail/internal/config"
	"net/http"
)

func (app *App) HomePage() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if config.DevStage() {
			http.ServeFile(w, r, "cmd/mailbox/webapp/index.html")
		} else {
			p, err := app.files.ReadFile("webapp/index.html")
			if err != nil {
				w.Write([]byte(err.Error()))
				return
			}
			w.Write(p)
		}
	})
}

func (app *App) LoginPage() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if config.DevStage() {
			http.ServeFile(w, r, "cmd/mailbox/webapp/login.html")
		} else {
			p, err := app.files.ReadFile("webapp/login.html")
			if err != nil {
				w.Write([]byte(err.Error()))
				return
			}
			w.Write(p)
		}
	})
}

func (app *App) RegisterPage() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if config.DevStage() {
			http.ServeFile(w, r, "cmd/mailbox/webapp/register.html")
		} else {
			p, err := app.files.ReadFile("webapp/register.html")
			if err != nil {
				w.Write([]byte(err.Error()))
				return
			}
			w.Write(p)
		}
	})
}
