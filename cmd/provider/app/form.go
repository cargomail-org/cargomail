package app

import (
	"net/http"
)

func (app *App) HomePage() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "cmd/provider/webapp/index.html")
	})
}

func (app *App) LoginPage() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "cmd/provider/webapp/login.html")
	})
}

func (app *App) RegisterPage() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "cmd/provider/webapp/register.html")
	})
}
