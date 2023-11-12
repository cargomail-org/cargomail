package agent

import "cargomail/internal/repository"

type Agent struct {
	MessageTransfer UseMessageTransferAgent
	ResourceRetrieval UseResourceRetrievalAgent
}

func NewAgent(repository repository.Repository) Agent {
	return Agent{
		MessageTransfer: &MessageTransferAgent{repository},
		ResourceRetrieval: &ResourceRetrievalAgent{repository},
	}
}
