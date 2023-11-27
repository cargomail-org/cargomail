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
	mssRouter := NewRouter()

	svc.routes(mssRouter)

	var fs http.Handler

	if config.DevStage() {
		fs = http.FileServer(http.Dir("cmd/mail/webapp"))
	} else {
		fs = http.FileServer(http.FS(files))
	}

	mssRouter.Route("GET", "/"+publicDir+"/", http.StripPrefix("/", fs))
	mssRouter.Route("GET", "/snippets/compose.page.html", http.StripPrefix("/", fs))
	mssRouter.Route("GET", "/snippets/contacts.page.html", http.StripPrefix("/", fs))
	mssRouter.Route("GET", "/snippets/files.page.html", http.StripPrefix("/", fs))
	mssRouter.Route("GET", "/snippets/inbox.page.html", http.StripPrefix("/", fs))
	mssRouter.Route("GET", "/snippets/sent.page.html", http.StripPrefix("/", fs))
	mssRouter.Route("GET", "/snippets/drafts.page.html", http.StripPrefix("/", fs))
	mssRouter.Route("GET", "/snippets/profile.page.html", http.StripPrefix("/", fs))

	mssHttp1Server := &http.Server{Handler: mssRouter, Addr: config.Configuration.MSSBind}
	mssHttp1ServerTLS := &http.Server{Handler: mssRouter, Addr: config.Configuration.MSSBindTLS}

	mhsRouter := NewRouter()

	svc.routes(mhsRouter)

	mhsHttp1Server := &http.Server{Handler: mhsRouter, Addr: config.Configuration.MHSBind}
	mhsHttp1ServerTLS := &http.Server{Handler: mhsRouter, Addr: config.Configuration.MHSBindTLS}

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := mssHttp1Server.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("http MSS shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := mssHttp1ServerTLS.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("https MSS shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := mhsHttp1Server.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("http MHS shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := mhsHttp1ServerTLS.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("https MHS shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		log.Printf("http MSS is listening on http://%s", mssHttp1Server.Addr)
		return mssHttp1Server.ListenAndServe()
	})

	errs.Go(func() error {
		log.Printf("https MSS is listening on https://%s", mssHttp1ServerTLS.Addr)
		return mssHttp1ServerTLS.ListenAndServeTLS(config.Configuration.MSSServerCertPath, config.Configuration.MSSServerKeyPath)
	})

	errs.Go(func() error {
		log.Printf("http MHS is listening on http://%s", mhsHttp1Server.Addr)
		return mhsHttp1Server.ListenAndServe()
	})

	errs.Go(func() error {
		log.Printf("https MHS is listening on https://%s", mhsHttp1ServerTLS.Addr)
		return mhsHttp1ServerTLS.ListenAndServeTLS(config.Configuration.MHSServerCertPath, config.Configuration.MHSServerKeyPath)
	})
}
