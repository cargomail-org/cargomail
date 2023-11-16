package agent

import "cargomail/internal/mailbox/repository"

type UseMessageTransferAgent interface {
	Transfer(user *repository.User, message *repository.Message) (*repository.Message, error)
}

type MessageTransferAgent struct {
	repository repository.Repository
}

func (a *MessageTransferAgent) Transfer(user *repository.User, message *repository.Message) (*repository.Message, error) {
	return nil, nil
}
