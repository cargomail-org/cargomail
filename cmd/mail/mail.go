package mail

import (
	"cargomail/cmd/mail/api"
	"cargomail/cmd/mail/app"
	"cargomail/internal/mailbox/repository"
	"cargomail/internal/shared/config"
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
		fs = http.FileServer(http.Dir("cmd/mail/webapp"))
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

	http1Server := &http.Server{Handler: router, Addr: config.Configuration.MailServiceBind}
	http1ServerTLS := &http.Server{Handler: router, Addr: config.Configuration.MailServiceBindTLS}

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := http1Server.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("mail (push layer) http service shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := http1ServerTLS.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("mail (push layer) https service shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		log.Printf("mail (push layer) http service is listening on http://%s", http1Server.Addr)
		return http1Server.ListenAndServe()
	})

	errs.Go(func() error {
		log.Printf("mail (push layer) https service is listening on https://%s", http1ServerTLS.Addr)
		return http1ServerTLS.ListenAndServeTLS(config.Configuration.MailServiceCertPath, config.Configuration.MailServiceKeyPath)
	})
}
