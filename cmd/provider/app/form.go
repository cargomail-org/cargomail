package app

import (
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"fmt"
	"log"
	"net/http"
	"strings"
)

func (app *App) HomePage() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		type Data struct {
			DomainName     string
			Username       string
			UsernameLetter string
		}

		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			log.Fatal("missing user context")
		}

		data := Data{DomainName: config.Configuration.DomainName, Username: user.Username, UsernameLetter: fmt.Sprintf("%c", strings.ToUpper(user.Username)[0])}

		t := app.HomeTemplate
		t.Execute(w, data)
	})
}

func (app *App) LoginPage() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		data := struct {
			DomainName string
		}{
			config.Configuration.DomainName,
		}

		t := app.LoginTemplate
		t.Execute(w, data)
	})
}

func (app *App) RegisterPage() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		data := struct {
			DomainName string
		}{
			config.Configuration.DomainName,
		}

		t := app.RegisterTemplate
		t.Execute(w, data)
	})
}
