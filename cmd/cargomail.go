package cargomail

import (
	"cargomail/cmd/provider"
	"cargomail/cmd/mta"
	"cargomail/cmd/rta"
	"cargomail/internal/config"
	"cargomail/internal/database"
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	sqlite3 "github.com/mattn/go-sqlite3"
	"golang.org/x/sync/errgroup"
)

func Start() error {
	ctx, done := context.WithCancel(context.Background())
	defer done()
	errs, ctx := errgroup.WithContext(ctx)

	sqlite3LibVersion, _, _ := sqlite3.Version()

	log.Printf("using sqlite3 version: %v, database %v", sqlite3LibVersion, config.Configuration.DatabasePath)

	db, err := sql.Open("sqlite3", config.Configuration.DatabasePath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	database.Init(db)

	// provider service
	providerService, err := provider.NewService(
		&provider.ServiceParams{
			DB: db,
		})
	if err != nil {
		log.Fatal(err)
	}
	providerService.Serve(ctx, errs)

	// mta service
	mtaService := mta.NewService(
		&mta.ServiceParams{
			DB: db,
		})
	mtaService.Serve(ctx, errs)

	// rta service
	rtaService := rta.NewService(
		&rta.ServiceParams{
			DB: db,
		})
	rtaService.Serve(ctx, errs)

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
