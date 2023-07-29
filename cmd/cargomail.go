package cargomail

import (
	"cargomail/cmd/provider"
	"cargomail/cmd/transfer"
	"cargomail/internal/config"
	"cargomail/internal/database"
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/sync/errgroup"
)

func Start() error {
	startFlags := config.NewStartFlags()

	ctx, done := context.WithCancel(context.Background())
	defer done()
	errs, ctx := errgroup.WithContext(ctx)

	log.Printf("using database %v", startFlags.DatabasePath)
	db, err := sql.Open("sqlite3", startFlags.DatabasePath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	database.Init(db)

	// provider service
	providerService, err := provider.NewService(
		&provider.ServiceParams{
			DomainName:   startFlags.DomainName,
			FilesPath:    startFlags.FilesPath,
			DB:           db,
			ProviderBind: startFlags.ProviderBind,
		})
	if err != nil {
		log.Fatal(err)
	}
	providerService.Serve(ctx, errs)

	// transfer service
	transferService := transfer.NewService(
		&transfer.ServiceParams{
			DomainName:       startFlags.DomainName,
			FilesPath:        startFlags.FilesPath,
			DB:               db,
			TransferCertPath: startFlags.TransferCertPath,
			TransferKeyPath:  startFlags.TransferKeyPath,
			TransferBind:     startFlags.TransferBind,
		})
	transferService.Serve(ctx, errs)

	go func() error {
		stop := make(chan os.Signal, 1)
		signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

		select {
		case sig := <-stop:
			log.Printf("Received signal: %s\n", sig)
			done()
		case <-ctx.Done():
			return ctx.Err()
		}
		return nil
	}()

	if err := errs.Wait(); err == nil || err == context.Canceled || err == http.ErrServerClosed {
		return nil
	} else {
		return err
	}
}
