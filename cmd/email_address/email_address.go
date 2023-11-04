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

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := http1Server.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("email address (push layer) service shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		log.Printf("email address (push layer) service is listening on https://%s", http1Server.Addr)
		return http1Server.ListenAndServeTLS(config.Configuration.EmailAddressCertPath, config.Configuration.EmailAddressKeyPath)
	})
}