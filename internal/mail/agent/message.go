package agent

import "cargomail/internal/repository"

type UseMessageTransferAgent interface {
	Send(user *repository.User, message *repository.Message) (*repository.Message, error)
}

type MessageTransferAgent struct {
	repository repository.Repository
}

func (a *MessageTransferAgent) Send(user *repository.User, message *repository.Message) (*repository.Message, error) {
	return nil, nil
}
