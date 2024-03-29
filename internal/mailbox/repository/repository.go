package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

type contextKey string

const UserContextKey = contextKey("user")

type RecipientsNotFoundError struct {
	Recipients []string
	Err        error
}

func (e *RecipientsNotFoundError) Error() string {
	return fmt.Sprintf("recipients %v: err %v", e.Recipients, e.Err)
}

var (
	ErrUsernameAlreadyTaken     = errors.New("username already taken")
	ErrUsernameNotFound         = errors.New("username not found")
	ErrInvalidCredentials       = errors.New("invalid authentication credentials")
	ErrMissingUserContext       = errors.New("missing user context")
	ErrInvalidOrMissingSession  = errors.New("invalid or missing session")
	ErrFailedValidationResponse = errors.New("failed validation")
	ErrContactNotFound          = errors.New("contact not found")
	ErrDuplicateContact         = errors.New("contact already exists")
	ErrInvalidEmailAddress      = errors.New("invalid email address")
	ErrBlobNotFound             = errors.New("blob not found")
	ErrBlobWrongName            = errors.New("wrong blob name")
	ErrFileNotFound             = errors.New("file not found")
	ErrDraftNotFound            = errors.New("draft not found")
	ErrMissingSender            = errors.New("missing sender")
	ErrInvalidSender            = errors.New("invalid sender")
	ErrMissingRecipients        = errors.New("missing recipient(s)")
	ErrInvalidRecipients        = errors.New("invalid recipient(s)")
	ErrRecipientNotFound        = errors.New("recipient(s) not found")
	ErrMessageNotFound          = errors.New("message not found")
	ErrMissingIdsField          = errors.New("missing 'ids' field")
	ErrMissingIdField           = errors.New("missing 'id' field")
	ErrMissingPayloadField      = errors.New("missing 'payload' field")
	ErrMissingHeadersField      = errors.New("missing 'headers' field")
	ErrMissingStateField        = errors.New("missing state field(s)")
	ErrWrongResourceDigest      = errors.New("wrong resource digest")
	ErrEmptyPayload             = errors.New("empty payload")
	ErrMissingContentType       = errors.New("missing content type")
	ErrUnknownMessageType       = errors.New("unknown message type")
)

type History struct {
	Id           int64 `json:"historyId"`
	IgnoreDevice bool  `json:"ignoreDevice"`
}

type Id struct {
	Id string `json:"id"`
}

type Ids struct {
	Ids []string `json:"ids"`
}

type Folder struct {
	Folder int `json:"folder"`
}

type State struct {
	Ids     []string `json:"ids"`
	Unread  *bool    `json:"unread"`
	Starred *bool    `json:"starred"`
}

type Repository struct {
	Blobs    UseBlobRepository
	Files    UseFileRepository
	Session  UseSessionRepository
	User     UseUserRepository
	Contacts UseContactRepository
	Drafts   UseDraftRepository
	Messages UseMessageRepository
	Threads  UseThreadRepository
}

const SaltSize int = 32
const KeySize int = 32
const IvSize int = 16

func NewRepository(db *sql.DB) Repository {
	return Repository{
		Blobs:    &BlobRepository{db: db},
		Files:    &FileRepository{db: db},
		Session:  &SessionRepository{db: db},
		User:     &UserRepository{db: db},
		Contacts: &ContactRepository{db: db},
		Drafts:   &DraftRepository{db: db},
		Messages: &MessageRepository{db: db},
		Threads:  &ThreadRepository{db: db},
	}
}

type Timestamp uint64

func (p *Timestamp) Scan(value interface{}) error {
	t := value.(time.Time).UnixMilli()
	*p = Timestamp(t)
	return nil
}

func getPrefixedDeviceId(userDeviceId *string) *string {
	var deviceId string

	if userDeviceId != nil && len(*userDeviceId) > 0 {
		deviceId = "device:" + *userDeviceId
		return &deviceId
	}

	return nil
}
