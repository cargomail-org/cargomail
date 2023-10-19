package storage

import (
	"cargomail/internal/repository"
)

type Storage struct {
	Blobs UseBlobStorage
	Files UseFileStorage
}

func NewStorage(repository repository.Repository) Storage {
	return Storage{
		Blobs: &BlobStorage{repository},
		Files: &FileStorage{repository},
	}
}
