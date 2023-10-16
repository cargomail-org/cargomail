package cargomail

import (
	"cargomail/cmd/email"
	"cargomail/cmd/mailbox"
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

	// mailbox (pull layer) service
	mailboxService, err := mailbox.NewService(
		&mailbox.ServiceParams{
			DB: db,
		})
	if err != nil {
		log.Fatal(err)
	}
	mailboxService.Serve(ctx, errs)

	// email (push layer) service
	emailService := email.NewService(
		&email.ServiceParams{
			DB: db,
		})
	emailService.Serve(ctx, errs)

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
