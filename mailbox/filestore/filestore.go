package filestore

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"strconv"

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
			size := event.Upload.Size
			path := event.Upload.Storage["Path"]

			file := emailv1.File{UriAtSender: uri, UriAtRecipient: uri, Filename: filename, Filetype: filetype, Size: size}

			logrus.Printf("User %s uploaded %s file", username, id)

			dbFile, err := emailRepository.Repo.FilesCreate(repo, username, &file)
			if err != nil {
				logrus.Errorf("Files database create error %s", err.Error())
			}

			sha256sum, err := checksum(path)
			if err != nil {
				logrus.Errorf("Checksum error %s", err.Error())
			}

			logrus.Printf("Checksum: %s", sha256sum)

			dbFile.Sha256Sum = sha256sum

			dbId, err := strconv.ParseInt(dbFile.Id, 10, 64)
			if err != nil {
				logrus.Errorf("Files database id error %s", err.Error())
			}

			_, err = emailRepository.Repo.FilesUpdate(repo, username, dbId, dbFile)
			if err != nil {
				logrus.Errorf("Files database update error %s", err.Error())
			}
		}
	}()

	mux.Handle(basePath, http.StripPrefix(basePath, handler))
}

func checksum(file string) (string, error) {
	f, err := os.Open(file)
	if err != nil {
		return "", err
	}

	defer func() {
		_ = f.Close()
	}()

	buf := make([]byte, 1024*1024)
	h := sha256.New()

	for {
		bytesRead, err := f.Read(buf)
		if err != nil {
			if err != io.EOF {
				return "", err
			}

			break
		}

		h.Write(buf[:bytesRead])
	}

	return hex.EncodeToString(h.Sum(nil)), nil
}
