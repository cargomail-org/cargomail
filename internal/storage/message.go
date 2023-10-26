package storage

import "cargomail/internal/repository"

type UseMessageStorage interface {
	List(user *repository.User, folder int) (*repository.MessageList, error)
	Sync(user *repository.User, history *repository.History) (*repository.MessageSync, error)
}

type MessageStorage struct {
	repository  repository.Repository
	blobStorage BlobStorage
}

func (s *MessageStorage) List(user *repository.User, folder int) (*repository.MessageList, error) {
	messageList, err := s.repository.Messages.List(user, folder)
	if err != nil {
		return nil, err
	}

	messages, err := ParsePlaceholderMessage(user, s.repository, s.blobStorage, messageList.Messages)
	if err != nil {
		return nil, err
	}

	messageList.Messages = messages

	return messageList, err
}

func (s *MessageStorage) Sync(user *repository.User, history *repository.History) (*repository.MessageSync, error) {
	messageList, err := s.repository.Messages.Sync(user, history)
	if err != nil {
		return nil, err
	}

	messages, err := ParsePlaceholderMessage(user, s.repository, s.blobStorage, messageList.MessagesInserted)
	if err != nil {
		return nil, err
	}

	messageList.MessagesInserted = messages

	messages, err = ParsePlaceholderMessage(user, s.repository, s.blobStorage, messageList.MessagesUpdated)
	if err != nil {
		return nil, err
	}

	messageList.MessagesUpdated = messages

	// TODO implement Untrash
	// messages, err = s.ParsePlaceholderMessage(user, s.repository, s.blobStorage, messageList.Untrashed)
	// if err != nil {
	// 	return nil, err
	// }

	// messageList.MessagesUntrashed = messages

	// otherwise for trashed and deleted do nothing i.e. return the placeholder message

	return messageList, err
}
