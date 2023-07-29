package repository

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UserRepository struct {
	db *sql.DB
}

type User struct {
	Id        int64     `json:"id"`
	Username  string    `json:"username"`
	Password  password  `json:"-"`
	FirstName string    `json:"firstname"`
	LastName  string    `json:"lastname"`
	CreatedAt time.Time `json:"created_at"`
	DeviceId  *string   `json:"-"`
}

type UserProfile struct {
	Username  string `json:"username"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
}

type password struct {
	plaintext *string
	hash      []byte
}

func (p *password) Set(plaintextPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(plaintextPassword), 12)
	if err != nil {
		return err
	}

	p.plaintext = &plaintextPassword
	p.hash = hash

	return nil
}

func (p *password) Matches(plaintextPassword string) (bool, error) {
	err := bcrypt.CompareHashAndPassword(p.hash, []byte(plaintextPassword))
	if err != nil {
		switch {
		case errors.Is(err, bcrypt.ErrMismatchedHashAndPassword):
			return false, nil
		default:
			return false, err
		}
	}

	return true, nil
}

func (r UserRepository) Create(user *User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO user (username, password_hash, firstname, lastname)
			VALUES ($1, $2, $3, $4)
			RETURNING id, created_at;`

	args := []interface{}{user.Username, user.Password.hash, user.FirstName, user.LastName}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(&user.Id, &user.CreatedAt)
	if err != nil {
		switch {
		case err.Error() == `UNIQUE constraint failed: user.username`:
			return ErrUsernameAlreadyTaken
		default:
			return err
		}
	}

	return nil
}

func (r UserRepository) UpdateProfile(user *User) (*UserProfile, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	profile := UserProfile{}

	query := `
		UPDATE user
			SET firstname = $1,
				lastname = $2
			WHERE username = $3;`

	args := []interface{}{user.FirstName, user.LastName, user.Username}

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return &profile, err
	}

	profile.Username = user.Username
	profile.FirstName = user.FirstName
	profile.LastName = user.LastName

	return &profile, err
}

func (r UserRepository) GetProfile(username string) (*UserProfile, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT username, firstname, lastname
			FROM user
			WHERE username = $1;`

	var profile UserProfile

	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&profile.Username,
		&profile.FirstName,
		&profile.LastName,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrUsernameNotFound
		default:
			return nil, err
		}
	}

	return &profile, nil
}

func (r UserRepository) GetByUsername(username string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, username, password_hash, created_at
			FROM user
			WHERE username = $1;`

	var user User

	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.Id,
		&user.Username,
		&user.Password.hash,
		&user.CreatedAt,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrUsernameNotFound
		default:
			return nil, err
		}
	}

	return &user, nil
}

func (r UserRepository) GetBySession(sessionScope, sessionPlaintext string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	sessionHash := sha256.Sum256([]byte(sessionPlaintext))

	query := `
		SELECT user.id, user.username, user.password_hash, user.created_at
			FROM user
			INNER JOIN session
			ON user.id = session.user_id
			WHERE session.hash = $1
			AND session.scope = $2
			AND session.expiry > $3;`

	args := []interface{}{sessionHash[:], sessionScope, time.Now()}

	var user User

	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&user.Id,
		&user.Username,
		&user.Password.hash,
		&user.CreatedAt,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrUsernameNotFound
		default:
			return nil, err
		}
	}

	return &user, nil
}
