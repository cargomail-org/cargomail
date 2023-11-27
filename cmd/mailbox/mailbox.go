package mailbox

import (
	"cargomail/cmd/mailbox/api"
	"cargomail/internal/mailbox/agent"
	"cargomail/internal/mailbox/repository"
	"cargomail/internal/mailbox/storage"
	"cargomail/internal/shared/config"
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"golang.org/x/sync/errgroup"
)

type ServiceParams struct {
	DB *sql.DB
}

type service struct {
	api api.Api
}

func NewService(params *ServiceParams) (service, error) {
	repository := repository.NewRepository(params.DB)
	storage := storage.NewStorage(repository)
	agent := agent.NewAgent(repository)

	return service{
		api: api.NewApi(
			api.ApiParams{
				Repository: repository,
				Storage:    storage,
				Agent:      agent,
			}),
	}, nil
}

func (svc *service) Serve(ctx context.Context, errs *errgroup.Group) {
	router := NewRouter()

	svc.routes(router)

	mdsHttp1Server := &http.Server{Handler: router, Addr: config.Configuration.MDSBind}
	mdsHttp1ServerTLS := &http.Server{Handler: router, Addr: config.Configuration.MDSBindTLS}
	// http2.ConfigureServer(http1Server, &http2.Server{})

	rhsRouter := NewRouter()

	svc.routes(rhsRouter)

	rhsHttp1Server := &http.Server{Handler: rhsRouter, Addr: config.Configuration.RHSBind}
	rhsHttp1ServerTLS := &http.Server{Handler: rhsRouter, Addr: config.Configuration.RHSBindTLS}
	// http2.ConfigureServer(http1Server, &http2.Server{})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := mdsHttp1Server.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("http MDS shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := mdsHttp1ServerTLS.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("https MDS shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := rhsHttp1Server.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("http RHS shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := rhsHttp1ServerTLS.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("https RHS shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		log.Printf("http MDS is listening on http://%s", mdsHttp1Server.Addr)
		return mdsHttp1Server.ListenAndServe()
	})

	errs.Go(func() error {
		log.Printf("https MDS is listening on https://%s", mdsHttp1ServerTLS.Addr)
		return mdsHttp1ServerTLS.ListenAndServeTLS(config.Configuration.MDSServerCertPath, config.Configuration.MDSServerKeyPath)
	})

	errs.Go(func() error {
		log.Printf("http RHS is listening on http://%s", rhsHttp1Server.Addr)
		return rhsHttp1Server.ListenAndServe()
	})

	errs.Go(func() error {
		log.Printf("https RHS is listening on https://%s", rhsHttp1ServerTLS.Addr)
		return rhsHttp1ServerTLS.ListenAndServeTLS(config.Configuration.RHSServerCertPath, config.Configuration.RHSServerKeyPath)
	})
}
