package resource

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

	resourcev1 "github.com/cargomail-org/cargomail/internal/models/resource/v1"
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
			// TODO send errors to the client
			event := <-handler.CompleteUploads
			username := event.HTTPRequest.Header.Get("Username")
			id := event.Upload.ID
			downloadUrl := config.Mailbox.Uri + config.Filestore.BasePath + id
			filename := event.Upload.MetaData["filename"]
			mimeType := event.Upload.MetaData["filetype"]
			uploadId := event.Upload.MetaData["uploadId"]
			fileSize := event.Upload.Size
			path := event.Upload.Storage["Path"]
			uploadSha256sum := event.HTTPRequest.Header.Get("sha256sum")

			file := resourcev1.File{DownloadUrl: downloadUrl, Filename: filename, MimeType: mimeType, FileSize: fileSize}

			logrus.Printf("User %s uploaded %s file %s using uploadId: %s", username, id, mimeType, uploadId)

			dbFile, err := emailRepository.Repo.FilesCreate(repo, username, &file)
			if err != nil {
				logrus.Errorf("Files database create error %s", err.Error())
			}

			sha256sum, err := checksum(path)
			if err != nil {
				logrus.Errorf("Checksum error %s", err.Error())
			}

			if len(uploadSha256sum) != 64 {
				logrus.Errorf("Checksum %s is not valid on filename %s", uploadSha256sum, filename)
			}

			if sha256sum != uploadSha256sum {
				logrus.Errorf("Checksum mismatch on filename %s: %s vs %s", filename, sha256sum, uploadSha256sum)
			}

			logrus.Printf("Checksum: %s", sha256sum)

			if dbFile != nil {
				dbFile.Sha256Sum = sha256sum

				dbId, err := strconv.ParseInt(dbFile.Id, 10, 64)
				if err != nil {
					logrus.Errorf("Files database id error %s", err.Error())
				}

				_, err = emailRepository.Repo.FilesUpdate(repo, username, dbId, uploadId, dbFile)
				if err != nil {
					logrus.Errorf("Files database update error %s", err.Error())
				}
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