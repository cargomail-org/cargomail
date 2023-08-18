package repository

import (
	"context"
	"database/sql"
	"time"
)

const (
	ScopeActivation     = "activation"
	ScopeAuthentication = "authentication"
)

type SessionRepository struct {
	db *sql.DB
}

type Session struct {
	Uri    string    `json:"uri"`
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
			RETURNING uri ;`

	args := []interface{}{session.UserID, session.Expiry, session.Scope}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(&session.Uri)
	if err != nil {
		return err
	}

	return err
}

func (r SessionRepository) Remove(user *User, uri string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		DELETE FROM "Session"
			WHERE "userId" = $1 AND
			"uri" = $2;`

	_, err := r.db.ExecContext(ctx, query, user.Id, uri)
	return err
}
