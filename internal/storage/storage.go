package storage

import (
	"cargomail/internal/repository"
)

type Storage struct {
	Blobs BlobStore
	Files FileStore
}

func NewStorage(repository repository.Repository) Storage {
	return Storage{
		Blobs: &BlobStorage{repository},
		Files: &FileStorage{repository},
	}
}
