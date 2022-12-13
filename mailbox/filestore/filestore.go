package filestore

import (
	"net/http"

	"github.com/sirupsen/logrus"
	"github.com/tus/tusd/pkg/filestore"
	tusd "github.com/tus/tusd/pkg/handler"

	cfg "github.com/cargomail-org/cargomail/internal/config"
)

func Run(mux *http.ServeMux, config *cfg.Config) {
	basePath := config.Filestore.BasePath
	path := config.Filestore.Path

	store := filestore.FileStore{
		Path: path,
	}

	composer := tusd.NewStoreComposer()
	store.UseIn(composer)

	handler, err := tusd.NewHandler(tusd.Config{
		BasePath:              basePath,
		StoreComposer:         composer,
		NotifyCompleteUploads: true,
	})
	if err != nil {
		logrus.Errorf("unable to create handler: %s", err)
	}

	go func() {
		for {
			event := <-handler.CompleteUploads
			logrus.Printf("Upload %s finished\n", event.Upload.ID)
		}
	}()

	mux.Handle(basePath, http.StripPrefix(basePath, handler))
}