package mailbox

import (
	"cargomail/cmd/mailbox/api"
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

	return service{
		api: api.NewApi(
			api.ApiParams{
				Repository: repository,
				Storage:    storage,
			}),
	}, nil
}

func (svc *service) Serve(ctx context.Context, errs *errgroup.Group) {
	router := NewRouter()

	svc.routes(router)

	http1Server := &http.Server{Handler: router, Addr: config.Configuration.MailboxServiceBind}
	http1ServerTLS := &http.Server{Handler: router, Addr: config.Configuration.MailboxServiceBindTLS}
	// http2.ConfigureServer(http1Server, &http2.Server{})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := http1Server.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("mailbox (pull layer) http service shutdown gracefully")
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
		log.Print("mailbox (pull layer) https service shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		log.Printf("mailbox (pull layer) http service is listening on http://%s", http1Server.Addr)
		return http1Server.ListenAndServe()
	})

	errs.Go(func() error {
		log.Printf("mailbox (pull layer) https service is listening on https://%s", http1ServerTLS.Addr)
		return http1ServerTLS.ListenAndServeTLS(config.Configuration.MailboxServiceCertPath, config.Configuration.MailboxServiceKeyPath)
	})
}
