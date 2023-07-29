package provider

import (
	"net/http"
	"strings"
)

type Entry struct {
	Method  string
	Path    string
	Handler http.Handler
}

type Router struct {
	routes []Entry
}

func NewRouter() *Router { return new(Router) }

func (t *Router) Route(method, path string, handler http.Handler) {
	e := Entry{
		Method:  method,
		Path:    path,
		Handler: handler,
	}

	t.routes = append(t.routes, e)
}

func (e *Entry) Match(r *http.Request) bool {
	if r.Method != e.Method {
		return false
	}

	if r.URL.Path == e.Path ||
		(len(e.Path) > 1 &&
			e.Path[len(e.Path)-2] != '/' &&
			e.Path[len(e.Path)-1] == '/' &&
			strings.HasPrefix(r.URL.Path, e.Path)) {
		return true
	}

	return false
}

func (t *Router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	for _, e := range t.routes {
		match := e.Match(r)
		if !match {
			continue
		}

		e.Handler.ServeHTTP(w, r)
		return
	}

	http.NotFound(w, r)
}

func (svc *service) routes(r *Router) {
	// App
	r.Route("GET", "/", svc.app.Authenticate(svc.app.HomePage()))
	r.Route("GET", "/login", svc.app.LoginPage())
	r.Route("GET", "/logout", svc.app.Logout())
	r.Route("GET", "/register", svc.app.RegisterPage())
	// r.Route("GET", "/auth/authenticate", svc.app.Session.Authenticate())

	// Health API
	r.Route("GET", "/api/v1/health", svc.api.Health.Healthcheck())

	// Auth API
	r.Route("POST", "/api/v1/auth/register", svc.api.User.Register())
	r.Route("POST", "/api/v1/auth/authenticate", svc.api.Session.Login())
	r.Route("POST", "/api/v1/auth/logout", svc.api.Session.Logout())

	// User API
	r.Route("PATCH", "/api/v1/user/profile", svc.api.Authenticate(svc.api.User.Profile()))
	r.Route("GET", "/api/v1/user/profile", svc.api.Authenticate(svc.api.User.Profile()))

	// Contacts API
	r.Route("POST", "/api/v1/contacts", svc.api.Authenticate(svc.api.Contacts.Create()))
	r.Route("GET", "/api/v1/contacts", svc.api.Authenticate(svc.api.Contacts.GetAll()))
	r.Route("POST", "/api/v1/contacts/sync", svc.api.Authenticate(svc.api.Contacts.GetHistory()))
	r.Route("PUT", "/api/v1/contacts", svc.api.Authenticate(svc.api.Contacts.Update()))
	r.Route("POST", "/api/v1/contacts/trash", svc.api.Authenticate(svc.api.Contacts.TrashByIdList()))
	r.Route("POST", "/api/v1/contacts/untrash", svc.api.Authenticate(svc.api.Contacts.UntrashByIdList()))
	r.Route("DELETE", "/api/v1/contacts/delete", svc.api.Authenticate(svc.api.Contacts.DeleteByIdList()))

	// Files API
	r.Route("POST", "/api/v1/files/upload", svc.api.Authenticate(svc.api.Files.Upload()))
	r.Route("GET", "/api/v1/files", svc.api.Authenticate(svc.api.Files.GetAll()))
	r.Route("POST", "/api/v1/files/sync", svc.api.Authenticate(svc.api.Files.GetHistory()))
	r.Route("HEAD", "/api/v1/files/", svc.api.Authenticate(svc.api.Files.Download()))
	r.Route("GET", "/api/v1/files/", svc.api.Authenticate(svc.api.Files.Download()))
	r.Route("POST", "/api/v1/files/trash", svc.api.Authenticate(svc.api.Files.TrashByIdList()))
	r.Route("POST", "/api/v1/files/untrash", svc.api.Authenticate(svc.api.Files.UntrashByIdList()))
	r.Route("DELETE", "/api/v1/files/delete", svc.api.Authenticate(svc.api.Files.DeleteByIdList()))
}
