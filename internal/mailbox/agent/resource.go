package agent

import "cargomail/internal/repository"

type UseResourceFetchAgent interface {
	FetchBlob(user *repository.User, blob *repository.Blob) (*repository.Blob, error)
	FetchFile(user *repository.User, file *repository.File) (*repository.File, error)
}

type ResourceFetchAgent struct {
	repository repository.Repository
}

func (a *ResourceFetchAgent) FetchBlob(user *repository.User, blob *repository.Blob) (*repository.Blob, error) {
	return nil, nil
}

func (a *ResourceFetchAgent) FetchFile(user *repository.User, file *repository.File) (*repository.File, error) {
	return nil, nil
}
