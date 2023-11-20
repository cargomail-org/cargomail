package agent

import (
	"bytes"
	"cargomail/internal/mailbox/repository"
	"cargomail/internal/shared/config"
	"encoding/json"
	"net/http"
)

type UseMessageSubmissionAgent interface {
	Post(user *repository.User, message *repository.Message) (*http.Response, error)
}

type MessageSubmissionAgent struct {
	repository repository.Repository
	httpClient *http.Client
}

func (a *MessageSubmissionAgent) Post(user *repository.User, message *repository.Message) (*http.Response, error) {
	endpoint := "/api/v1/messages/post"
	URL := "https://" + config.Configuration.MailServiceBindTLS + endpoint

	messageJSON, err := json.Marshal(message)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", URL, bytes.NewBuffer(messageJSON))
	if err != nil {
		return nil, err
	}

	response, err := a.httpClient.Do(req)
	if err != nil {
		return nil, err
	}

	defer response.Body.Close()

	return response, err
}
