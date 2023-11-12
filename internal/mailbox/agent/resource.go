package agent

import "cargomail/internal/repository"

type UseResourceRetrievalAgent interface {
	DownloadBlob(user *repository.User, blob *repository.Blob) (*repository.Blob, error)
	DownloadFile(user *repository.User, file *repository.File) (*repository.File, error)
}

type ResourceRetrievalAgent struct {
	repository  repository.Repository
}

func (a *ResourceRetrievalAgent) DownloadBlob(user *repository.User, blob *repository.Blob) (*repository.Blob, error) {
	return nil, nil
}

func (a *ResourceRetrievalAgent) DownloadFile(user *repository.User, file *repository.File) (*repository.File, error) {
	return nil, nil
}