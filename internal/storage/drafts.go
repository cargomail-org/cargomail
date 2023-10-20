package storage

import (
	"cargomail/internal/repository"
)

type UseDraftStorage interface {
	Create(user *repository.User, draft *repository.Draft) (*repository.Draft, error)
	List(user *repository.User) (*repository.DraftList, error)
	Update(user *repository.User, draft *repository.Draft) (*repository.Draft, error)
	// Trash(user *repository.User, ids string) error
	// Untrash(user *repository.User, ids string) error
	// Delete(user *repository.User, ids string) error
	// Send(user *repository.User, draft *repository.Draft) (*repository.Message, error)
}

type DraftStorage struct {
	repository repository.Repository
}

func (s *DraftStorage) Create(user *repository.User, draft *repository.Draft) (*repository.Draft, error) {
	return s.repository.Drafts.Create(user, draft)
}
func (s *DraftStorage) List(user *repository.User) (*repository.DraftList, error) {
	return s.repository.Drafts.List(user)
}

func (s *DraftStorage) Update(user *repository.User, draft *repository.Draft) (*repository.Draft, error) {
	return s.repository.Drafts.Update(user, draft)
}
