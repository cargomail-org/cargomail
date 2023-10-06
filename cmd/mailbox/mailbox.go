package mailbox

import (
	"cargomail/cmd/mailbox/api"
	"cargomail/cmd/mailbox/app"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"context"
	"database/sql"
	"embed"
	"log"
	"net/http"
	"time"

	"golang.org/x/sync/errgroup"
)

const (
	webappDir = "webapp"
	publicDir = "public"
)

var (
	//go:embed webapp/*
	files embed.FS
)

type ServiceParams struct {
	DB *sql.DB
}

type service struct {
	app app.App
	api api.Api
}

func NewService(params *ServiceParams) (service, error) {
	repository := repository.NewRepository(params.DB)

	return service{
		app: app.NewApp(
			app.AppParams{
				Repository: repository,
				Files:      files,
			}),
		api: api.NewApi(
			api.ApiParams{
				Repository: repository,
			}),
	}, nil
}

func (svc *service) Serve(ctx context.Context, errs *errgroup.Group) {
	router := NewRouter()

	svc.routes(router)

	var fs http.Handler

	if config.DevStage() {
		fs = http.FileServer(http.Dir("cmd/mailbox/webapp"))
	} else {
		fs = http.FileServer(http.FS(files))
	}

	router.Route("GET", "/"+publicDir+"/", http.StripPrefix("/", fs))
	router.Route("GET", "/snippets/compose.page.html", http.StripPrefix("/", fs))
	router.Route("GET", "/snippets/contacts.page.html", http.StripPrefix("/", fs))
	router.Route("GET", "/snippets/files.page.html", http.StripPrefix("/", fs))
	router.Route("GET", "/snippets/inbox.page.html", http.StripPrefix("/", fs))
	router.Route("GET", "/snippets/sent.page.html", http.StripPrefix("/", fs))
	router.Route("GET", "/snippets/drafts.page.html", http.StripPrefix("/", fs))
	router.Route("GET", "/snippets/profile.page.html", http.StripPrefix("/", fs))

	http1Server := &http.Server{Handler: router, Addr: config.Configuration.MailboxBind}
	// http2.ConfigureServer(http1Server, &http2.Server{})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := http1Server.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("mailbox service shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		log.Printf("mailbox service is listening on http://%s", http1Server.Addr)
		return http1Server.ListenAndServe()
	})
}
