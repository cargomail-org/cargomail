package email_address

import (
	"cargomail/cmd/email_address/api"
	"cargomail/internal/config"
	"cargomail/internal/repository"
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

func NewService(params *ServiceParams) service {
	repository := repository.NewRepository(params.DB)
	return service{
		api: api.NewApi(
			api.ApiParams{
				Repository: repository,
			}),
	}
}

func (svc *service) Serve(ctx context.Context, errs *errgroup.Group) {
	// Routes
	mux := http.NewServeMux()
	svc.routes(mux)

	http1Server := &http.Server{Handler: mux, Addr: config.Configuration.EmailAddressBind}
	http1ServerTLS := &http.Server{Handler: mux, Addr: config.Configuration.EmailAddressBindTLS}

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := http1Server.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("email address (push layer) http service shutdown gracefully")
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
		log.Print("email address (push layer) https service shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		log.Printf("email address (push layer) http service is listening on http://%s", http1Server.Addr)
		return http1Server.ListenAndServe()
	})

	errs.Go(func() error {
		log.Printf("email address (push layer) https service is listening on https://%s", http1ServerTLS.Addr)
		return http1ServerTLS.ListenAndServeTLS(config.Configuration.EmailAddressCertPath, config.Configuration.EmailAddressKeyPath)
	})
}
