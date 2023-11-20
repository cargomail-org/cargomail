package mail

import (
	"cargomail/internal/shared/config"
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
	r.Route("POST", "/api/v1/health", svc.api.Health.Healthcheck())

	// Auth API
	r.Route("GET", "/api/v1/auth/info", svc.api.Auth.Info())
	r.Route("GET", "/api/v1/auth/userinfo", svc.api.Authenticate(svc.api.Auth.Info()))
	r.Route("POST", "/api/v1/auth/register", svc.api.User.Register())
	r.Route("POST", "/api/v1/auth/authenticate", svc.api.Session.Login())
	r.Route("POST", "/api/v1/auth/logout", svc.api.Authenticate(svc.api.Session.Logout()))

	// User API
	r.Route("PUT", "/api/v1/user/profile", svc.api.Authenticate(svc.api.User.Profile()))
	r.Route("GET", "/api/v1/user/profile", svc.api.Authenticate(svc.api.User.Profile()))

	// Messages API
	r.Route("POST", "/api/v1/messages/post", svc.api.Authenticate(svc.api.Messages.Post()))
}
