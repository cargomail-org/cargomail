package agent

import "cargomail/internal/repository"

type UseMessageTransferAgent interface {
	Send(user *repository.User, message *repository.Message) (*repository.Message, error)
}

func Send(user *repository.User, message *repository.Message) (*repository.Message, error) {
	return nil, nil
}
