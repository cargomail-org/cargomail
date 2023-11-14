package storage

import (
	"cargomail/internal/mailbox/repository"
)

type UseDraftStorage interface {
	Create(user *repository.User, draft *repository.Draft) (*repository.Draft, error)
	List(user *repository.User) (*repository.DraftList, error)
	Sync(user *repository.User, history *repository.History) (*repository.DraftSync, error)
	Update(user *repository.User, draft *repository.Draft) (*repository.Draft, error)
	// Trash(user *repository.User, ids string) error
	// Untrash(user *repository.User, ids string) error
	// Delete(user *repository.User, ids string) error
	// Send(user *repository.User, draft *repository.Draft) (*repository.Message, error)
}

type DraftStorage struct {
	repository  repository.Repository
	blobStorage BlobStorage
}

func (s *DraftStorage) Create(user *repository.User, draft *repository.Draft) (*repository.Draft, error) {
	draft, err := ComposePlaceholderMessage(user, s.blobStorage, draft)
	if err != nil {
		return nil, err
	}

	return s.repository.Drafts.Create(user, draft)
}

func (s *DraftStorage) List(user *repository.User) (*repository.DraftList, error) {
	draftList, err := s.repository.Drafts.List(user)
	if err != nil {
		return nil, err
	}

	drafts, err := ParsePlaceholderMessage(user, s.repository, s.blobStorage, draftList.Drafts)
	if err != nil {
		return nil, err
	}

	draftList.Drafts = drafts

	return draftList, err
}

func (s *DraftStorage) Sync(user *repository.User, history *repository.History) (*repository.DraftSync, error) {
	draftList, err := s.repository.Drafts.Sync(user, history)
	if err != nil {
		return nil, err
	}

	drafts, err := ParsePlaceholderMessage(user, s.repository, s.blobStorage, draftList.DraftsInserted)
	if err != nil {
		return nil, err
	}

	draftList.DraftsInserted = drafts

	drafts, err = ParsePlaceholderMessage(user, s.repository, s.blobStorage, draftList.DraftsUpdated)
	if err != nil {
		return nil, err
	}

	draftList.DraftsUpdated = drafts

	// TODO implement Untrash
	// drafts, err = s.ParsePlaceholderMessage(user, s.repository, s.blobStorage, draftList.Untrashed)
	// if err != nil {
	// 	return nil, err
	// }

	// draftList.DraftsUntrashed = drafts

	// otherwise for trashed and deleted do nothing i.e. return the placeholder message

	return draftList, err
}

func (s *DraftStorage) Update(user *repository.User, draft *repository.Draft) (*repository.Draft, error) {
	_, err := s.repository.Drafts.GetById(user, draft.Id)
	if err != nil {
		return nil, err
	}

	draft, err = ComposePlaceholderMessage(user, s.blobStorage, draft)
	if err != nil {
		return nil, err
	}

	return s.repository.Drafts.Update(user, draft)
}
