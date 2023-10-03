package provider

import (
	"cargomail/internal/config"
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
	if r.Method != "OPTIONS" && r.Method != e.Method {
		return false
	}

	urlPath := r.URL.Path

	if !strings.HasPrefix(urlPath, "/snippets/") {
		urlPath = strings.TrimSuffix(urlPath, ".html")
	}

	if urlPath == e.Path ||
		(len(e.Path) > 1 &&
			e.Path[len(e.Path)-2] != '/' &&
			e.Path[len(e.Path)-1] == '/' &&
			strings.HasPrefix(urlPath, e.Path)) {
		return true
	}

	return false
}

func setupCORS(w *http.ResponseWriter, r *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, PATCH, DELETE, HEAD")
	(*w).Header().Set("Access-Control-Allow-Credentials", "true")
	(*w).Header().Set("Access-Control-Allow-Headers", "Original-Subject, Origin, X-Requested-With, Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-Warning")
}

func (t *Router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	for _, e := range t.routes {
		match := e.Match(r)
		if !match {
			continue
		}

		setupCORS(&w, r)
		if r.Method == "OPTIONS" {
			return
		}

		urlPath := r.URL.Path

		if strings.HasSuffix(urlPath, "/upload") {
			r.Body = http.MaxBytesReader(w, r.Body, config.DefaultMaxUploadSize<<20)
		} else {
			r.Body = http.MaxBytesReader(w, r.Body, config.DefaultMaxBodySize<<20)
		}

		if !config.DevStage() {
			if strings.HasPrefix(r.URL.Path, "/public/") || strings.HasPrefix(r.URL.Path, "/snippets/") {
				r.URL.Path = "/webapp" + r.URL.Path
			}
		}

		e.Handler.ServeHTTP(w, r)
		return
	}

	http.NotFound(w, r)
}

func (svc *service) routes(r *Router) {
	// App
	r.Route("GET", "/", http.StripPrefix("/", svc.app.Authenticate(svc.app.HomePage())))
	r.Route("GET", "/login", svc.app.LoginPage())
	r.Route("GET", "/logout", svc.app.Authenticate(svc.app.Logout()))
	r.Route("GET", "/register", svc.app.RegisterPage())
	// r.Route("GET", "/auth/authenticate", svc.app.Session.Authenticate())

	// Health API
	r.Route("GET", "/api/v1/health", svc.api.Health.Healthcheck())

	// Auth API
	r.Route("GET", "/api/v1/auth/info", svc.api.Auth.Info())
	r.Route("GET", "/api/v1/auth/userinfo", svc.api.Authenticate(svc.api.Auth.Info()))
	r.Route("POST", "/api/v1/auth/register", svc.api.User.Register())
	r.Route("POST", "/api/v1/auth/authenticate", svc.api.Session.Login())
	r.Route("POST", "/api/v1/auth/logout", svc.api.Authenticate(svc.api.Session.Logout()))

	// User API
	r.Route("PUT", "/api/v1/user/profile", svc.api.Authenticate(svc.api.User.Profile()))
	r.Route("GET", "/api/v1/user/profile", svc.api.Authenticate(svc.api.User.Profile()))

	// Contacts API
	r.Route("POST", "/api/v1/contacts", svc.api.Authenticate(svc.api.Contacts.Create()))
	r.Route("POST", "/api/v1/contacts/list", svc.api.Authenticate(svc.api.Contacts.List()))
	r.Route("POST", "/api/v1/contacts/sync", svc.api.Authenticate(svc.api.Contacts.Sync()))
	r.Route("PUT", "/api/v1/contacts", svc.api.Authenticate(svc.api.Contacts.Update()))
	r.Route("POST", "/api/v1/contacts/trash", svc.api.Authenticate(svc.api.Contacts.Trash()))
	r.Route("POST", "/api/v1/contacts/untrash", svc.api.Authenticate(svc.api.Contacts.Untrash()))
	r.Route("DELETE", "/api/v1/contacts/delete", svc.api.Authenticate(svc.api.Contacts.Delete()))

	// Files API
	r.Route("POST", "/api/v1/files/upload", svc.api.Authenticate(svc.api.Files.Upload()))
	r.Route("POST", "/api/v1/files/list", svc.api.Authenticate(svc.api.Files.List()))
	r.Route("POST", "/api/v1/files/sync", svc.api.Authenticate(svc.api.Files.Sync()))
	r.Route("HEAD", "/api/v1/files/", svc.api.Authenticate(svc.api.Files.Download()))
	r.Route("GET", "/api/v1/files/", svc.api.Authenticate(svc.api.Files.Download()))
	r.Route("POST", "/api/v1/files/trash", svc.api.Authenticate(svc.api.Files.Trash()))
	r.Route("POST", "/api/v1/files/untrash", svc.api.Authenticate(svc.api.Files.Untrash()))
	r.Route("DELETE", "/api/v1/files/delete", svc.api.Authenticate(svc.api.Files.Delete()))

	// Blobs API
	r.Route("POST", "/api/v1/blobs/upload", svc.api.Authenticate(svc.api.Blobs.Upload()))
	r.Route("POST", "/api/v1/blobs/list", svc.api.Authenticate(svc.api.Blobs.List()))
	r.Route("POST", "/api/v1/blobs/sync", svc.api.Authenticate(svc.api.Blobs.Sync()))
	r.Route("PUT", "/api/v1/blobs/upload", svc.api.Authenticate(svc.api.Blobs.Upload()))
	r.Route("HEAD", "/api/v1/blobs/", svc.api.Authenticate(svc.api.Blobs.Download()))
	r.Route("GET", "/api/v1/blobs/", svc.api.Authenticate(svc.api.Blobs.Download()))
	r.Route("POST", "/api/v1/blobs/trash", svc.api.Authenticate(svc.api.Blobs.Trash()))
	r.Route("POST", "/api/v1/blobs/untrash", svc.api.Authenticate(svc.api.Blobs.Untrash()))
	r.Route("DELETE", "/api/v1/blobs/delete", svc.api.Authenticate(svc.api.Blobs.Delete()))

	// Drafts API
	r.Route("POST", "/api/v1/drafts", svc.api.Authenticate(svc.api.Drafts.Create()))
	r.Route("POST", "/api/v1/drafts/list", svc.api.Authenticate(svc.api.Drafts.List()))
	r.Route("POST", "/api/v1/drafts/sync", svc.api.Authenticate(svc.api.Drafts.Sync()))
	r.Route("PUT", "/api/v1/drafts", svc.api.Authenticate(svc.api.Drafts.Update()))
	r.Route("POST", "/api/v1/drafts/trash", svc.api.Authenticate(svc.api.Drafts.Trash()))
	r.Route("POST", "/api/v1/drafts/untrash", svc.api.Authenticate(svc.api.Drafts.Untrash()))
	r.Route("DELETE", "/api/v1/drafts/delete", svc.api.Authenticate(svc.api.Drafts.Delete()))
	r.Route("POST", "/api/v1/drafts/send", svc.api.Authenticate(svc.api.Drafts.Send()))

	// Messages API
	r.Route("POST", "/api/v1/messages/list", svc.api.Authenticate(svc.api.Messages.List()))
	r.Route("POST", "/api/v1/messages/sync", svc.api.Authenticate(svc.api.Messages.Sync()))
	r.Route("PATCH", "/api/v1/messages", svc.api.Authenticate(svc.api.Messages.Update()))
	r.Route("POST", "/api/v1/messages/trash", svc.api.Authenticate(svc.api.Messages.Trash()))
	r.Route("POST", "/api/v1/messages/untrash", svc.api.Authenticate(svc.api.Messages.Untrash()))
	r.Route("DELETE", "/api/v1/messages/delete", svc.api.Authenticate(svc.api.Messages.Delete()))

	// Threads API
	r.Route("POST", "/api/v1/threads/list", svc.api.Authenticate(svc.api.Threads.List()))
	r.Route("POST", "/api/v1/threads/trash", svc.api.Authenticate(svc.api.Threads.Trash()))
	r.Route("POST", "/api/v1/threads/untrash", svc.api.Authenticate(svc.api.Threads.Untrash()))
	r.Route("DELETE", "/api/v1/threads/delete", svc.api.Authenticate(svc.api.Threads.Delete()))
}
