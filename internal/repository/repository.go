package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

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
	ErrFileNotFound             = errors.New("file not found")
	ErrDraftNotFound            = errors.New("draft not found")
	ErrMissingSender            = errors.New("missing sender")
	ErrInvalidSender            = errors.New("invalid sender")
	ErrMissingRecipients        = errors.New("missing recipient(s)")
	ErrInvalidRecipients        = errors.New("invalid recipient(s)")
	ErrRecipientNotFound        = errors.New("recipient(s) not found")
	ErrMessageNotFound          = errors.New("message not found")
	ErrMissingUrisField         = errors.New("missing 'uris' field")
	ErrMissingUriField          = errors.New("missing 'uri' field")
	ErrMissingPayloadField      = errors.New("missing 'payload' field")
	ErrMissingHeadersField      = errors.New("missing 'headers' field")
	ErrMissingStateField        = errors.New("missing state field(s)")
)

type History struct {
	Id int64 `json:"historyId"`
}

type Uri struct {
	Uri string `json:"uri"`
}

type Uris struct {
	Uris []string `json:"uris"`
}

type Folder struct {
	FolderId int `json:"folderId"`
}

type State struct {
	Uris    []string `json:"uris"`
	Unread  *bool    `json:"unread"`
	Starred *bool    `json:"starred"`
}

type Repository struct {
	Blobs    BlobRepository
	Files    FileRepository
	Session  SessionRepository
	User     UserRepository
	Contacts ContactRepository
	Drafts   DraftRepository
	Messages MessageRepository
}

func NewRepository(db *sql.DB) Repository {
	return Repository{
		Blobs:    BlobRepository{db: db},
		Files:    FileRepository{db: db},
		Session:  SessionRepository{db: db},
		User:     UserRepository{db: db},
		Contacts: ContactRepository{db: db},
		Drafts:   DraftRepository{db: db},
		Messages: MessageRepository{db: db},
	}
}

type Timestamp int64

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
