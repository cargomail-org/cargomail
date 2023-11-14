package agent

import "cargomail/internal/mailbox/repository"

type Agent struct {
	MessageTransfer UseMessageTransferAgent
}

func NewAgent(repository repository.Repository) Agent {
	return Agent{
		MessageTransfer: &MessageTransferAgent{repository},
	}
}
