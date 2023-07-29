package repository

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base32"
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
	Plaintext string    `json:"session"`
	Hash      []byte    `json:"-"`
	UserID    int64     `json:"-"`
	Expiry    time.Time `json:"expiry"`
	Scope     string    `json:"-"`
}

func generateSession(userID int64, ttl time.Duration, scope string) (*Session, error) {
	session := &Session{
		UserID: userID,
		Expiry: time.Now().Add(ttl),
		Scope:  scope,
	}

	randomBytes := make([]byte, 32)

	_, err := rand.Read(randomBytes)
	if err != nil {
		return nil, err
	}

	session.Plaintext = base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomBytes)

	hash := sha256.Sum256([]byte(session.Plaintext))
	session.Hash = hash[:]

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
		INSERT INTO session (hash, user_id, expiry, scope)
			VALUES ($1, $2, $3, $4);`

	args := []interface{}{session.Hash, session.UserID, session.Expiry, session.Scope}

	_, err := r.db.ExecContext(ctx, query, args...)
	return err
}

func (r SessionRepository) Remove(session string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	sessionHash := sha256.Sum256([]byte(session))

	query := `
		DELETE FROM session
			WHERE hash = $1;`

	_, err := r.db.ExecContext(ctx, query, sessionHash[:])
	return err
}
