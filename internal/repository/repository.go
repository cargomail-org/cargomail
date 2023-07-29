package repository

import (
	"database/sql"
	"errors"
	"time"
)

var (
	ErrUsernameAlreadyTaken     = errors.New("username already taken")
	ErrUsernameNotFound         = errors.New("username not found")
	ErrInvalidCredentials       = errors.New("invalid authentication credentials")
	ErrMissingUserContext       = errors.New("missing user context")
	ErrInvalidOrMissingSession  = errors.New("invalid or missing session")
	ErrFailedValidationResponse = errors.New("failed validation")
	ErrFileNameNotFound         = errors.New("filename not found")
)

type History struct {
	Id int64 `json:"history_id"`
}

type Repository struct {
	Files    FilesRepository
	Session  SessionRepository
	User     UserRepository
	Contacts ContactsRepository
}

func NewRepository(db *sql.DB) Repository {
	return Repository{
		Files:    FilesRepository{db: db},
		Session:  SessionRepository{db: db},
		User:     UserRepository{db: db},
		Contacts: ContactsRepository{db: db},
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
