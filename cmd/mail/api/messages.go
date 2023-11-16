package api

import (
	"cargomail/cmd/mail/api/helper"
	"cargomail/internal/mailbox/repository"
	"net/http"
)

type MessagesApi struct {
	useMessageRepository repository.UseMessageRepository
}

func (api *MessagesApi) Post() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		/*user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var message *repository.Message

		err := helper.Decoder(r.Body).Decode(&message)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if message.Id == "" {
			http.Error(w, repository.ErrMissingIdField.Error(), http.StatusBadRequest)
			return
		}

		if message.Payload == nil {
			http.Error(w, repository.ErrMissingPayloadField.Error(), http.StatusBadRequest)
			return
		}

		if message.Payload.Headers == nil {
			http.Error(w, repository.ErrMissingHeadersField.Error(), http.StatusBadRequest)
			return
		}

		err = api.useMessageRepository.Post(user, message)
			if err != nil {
				recipientsNotFoundError := &repository.RecipientsNotFoundError{}

				switch {
				case errors.As(err, &recipientsNotFoundError):
					warning := recipientsNotFoundError.Err.Error() + ": " + strings.Join(recipientsNotFoundError.Recipients, ", ")
					w.Header().Set("X-Warning", string(warning))
					goto ok
				case errors.Is(err, repository.ErrMessageNotFound):
					helper.ReturnErr(w, err, http.StatusNotFound)
				default:
					helper.ReturnErr(w, err, http.StatusInternalServerError)
				}
				return
			}
		ok:*/
		helper.SetJsonResponse(w, http.StatusOK, nil)
	})
}
