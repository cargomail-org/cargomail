package agent

import "cargomail/internal/mailbox/repository"

type Agent struct {
	MessageTransfer UseMessageTransferAgent
	ResourceFetch   UseResourceFetchAgent
}

func NewAgent(repository repository.Repository) Agent {
	return Agent{
		MessageTransfer: &MessageTransferAgent{repository},
		ResourceFetch:   &ResourceFetchAgent{repository},
	}
}
