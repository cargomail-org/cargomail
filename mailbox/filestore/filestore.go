package filestore

import (
	"net/http"

	"github.com/sirupsen/logrus"
	"github.com/tus/tusd/pkg/filestore"
	tusd "github.com/tus/tusd/pkg/handler"

	emailv1 "github.com/cargomail-org/cargomail/generated/proto/email/v1"
	cfg "github.com/cargomail-org/cargomail/internal/config"
	emailRepository "github.com/cargomail-org/cargomail/internal/repository/email/v1"
)

func Run(mux *http.ServeMux, repo emailRepository.Repo, config *cfg.Config) {
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
			username := event.HTTPRequest.Header.Get("Username")
			id := event.Upload.ID
			uri := config.Mailbox.Uri + config.Filestore.BasePath + id
			filename := event.Upload.MetaData["filename"]
			filetype := event.Upload.MetaData["filetype"]

			file := emailv1.File{UriAtSender: uri, UriAtRecipient: uri, Filename: filename, Filetype: filetype}

			logrus.Printf("User %s uploaded %s file \n", username, id)

			fileDb, err := emailRepository.Repo.FilesCreate(repo, username, &file)
			if err != nil {
				logrus.Errorf("Upload error %s\n", err.Error())
			}

			logrus.Printf("File database id %s\n", fileDb.Id)
		}
	}()

	mux.Handle(basePath, http.StripPrefix(basePath, handler))
}
