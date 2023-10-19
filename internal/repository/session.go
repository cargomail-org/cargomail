package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type UseSessionRepository interface {
	New(userID int64, ttl time.Duration, scope string) (*Session, error)
	Insert(session *Session) error
	UpdateIfOlderThan5Minutes(user *User, id string, expiry time.Time) (bool, error)
	Remove(user *User, id string) error
}

const (
	ScopeActivation     = "activation"
	ScopeAuthentication = "authentication"
)

type SessionRepository struct {
	db *sql.DB
}

type Session struct {
	Id     string    `json:"id"`
	UserID int64     `json:"-"`
	Expiry time.Time `json:"expiry"`
	Scope  string    `json:"-"`
}

func generateSession(userID int64, ttl time.Duration, scope string) (*Session, error) {
	session := &Session{
		UserID: userID,
		Expiry: time.Now().Add(ttl),
		Scope:  scope,
	}

	return session, nil
}

func (r SessionRepository) New(userID int64, ttl time.Duration, scope string) (*Session, error) {
	session, err := generateSession(userID, ttl, scope)
	if err != nil {
		return nil, err
	}

	err = r.Insert(session)
	return session, err
}

func (r SessionRepository) Insert(session *Session) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO "Session" ("userId", "expiry", "scope")
			VALUES ($1, $2, $3)
			RETURNING id ;`

	args := []interface{}{session.UserID, session.Expiry, session.Scope}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(&session.Id)
	if err != nil {
		return err
	}

	return err
}

func (r SessionRepository) UpdateIfOlderThan5Minutes(user *User, id string, expiry time.Time) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 300 = 5 minutes
	query := `
		UPDATE "Session"
			SET "expiry" = $1
			WHERE "userId" = $2 AND
			      "id" = $3 AND
				  ROUND((JULIANDAY($1) - JULIANDAY("expiry")) * 86400) > 300
				  RETURNING id;`

	args := []interface{}{expiry, user.Id, id}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(&id)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return false, nil
		default:
			return false, err
		}
	}

	return true, err
}

func (r SessionRepository) Remove(user *User, id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		DELETE FROM "Session"
			WHERE "userId" = $1 AND
			"id" = $2;`

	args := []interface{}{user.Id, id}

	_, err := r.db.ExecContext(ctx, query, args...)
	return err
}
