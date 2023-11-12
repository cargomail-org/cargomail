package agent

import "cargomail/internal/repository"

type UseMessageTransferAgent interface {
	Forward(user *repository.User, message *repository.Message) (*repository.Message, error)
}

type MessageTransferAgent struct {
	repository repository.Repository
}

func (a *MessageTransferAgent) Forward(user *repository.User, message *repository.Message) (*repository.Message, error) {
	return nil, nil
}
