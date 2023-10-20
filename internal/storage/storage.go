package storage

import (
	"cargomail/internal/repository"
)

type Storage struct {
	Blobs  UseBlobStorage
	Files  UseFileStorage
	Drafts UseDraftStorage
}

func NewStorage(repository repository.Repository) Storage {
	return Storage{
		Blobs:  &BlobStorage{repository},
		Files:  &FileStorage{repository},
		Drafts: &DraftStorage{repository},
	}
}
