package repository

import (
	"cargomail/internal/config"
	"context"
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UseUserRepository interface {
	Create(user *User) error
	UpdateProfile(user *User) (*UserProfile, error)
	GetProfile(username string) (*UserProfile, error)
	GetByUsername(username string) (*User, error)
	GetBySession(sessionScope, id string) (*User, error)
}

type UserRepository struct {
	db *sql.DB
}

type User struct {
	Id        int64     `json:"id"`
	Username  string    `json:"username"`
	Password  password  `json:"-"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	CreatedAt time.Time `json:"createdAt"`
	DeviceId  *string   `json:"-"`
}

type UserProfile struct {
	Username  string `json:"username"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

type password struct {
	plaintext *string
	hash      []byte
}

func (u User) Fullname() string {
	if len(u.FirstName) > 0 && len(u.LastName) > 0 {
		return u.FirstName + " " + u.LastName
	}

	return u.FirstName + u.LastName
}

func (u User) FullnameAndAddress() string {
	address := "<" + u.Username + "@" + config.Configuration.DomainName + ">"
	fullname := u.Fullname()

	if len(fullname) > 0 {
		return fullname + " " + address
	}

	return address
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
		INSERT INTO "user" ("username", "passwordHash", "firstName", "lastName")
			VALUES ($1, $2, $3, $4)
			RETURNING "id", "createdAt";`

	args := []interface{}{user.Username, user.Password.hash, user.FirstName, user.LastName}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(&user.Id, &user.CreatedAt)
	if err != nil {
		switch {
		case err.Error() == `UNIQUE constraint failed: User.username`:
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
		UPDATE "user"
			SET "firstName" = $1,
				"lastName" = $2
			WHERE "username" = $3;`

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
		SELECT "username", "firstName", "lastName"
			FROM "user"
			WHERE "username" = $1;`

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
		SELECT "id", "username", "passwordHash", "firstName", "lastName", "createdAt"
			FROM "User"
			WHERE "username" = $1;`

	var user User

	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.Id,
		&user.Username,
		&user.Password.hash,
		&user.FirstName,
		&user.LastName,
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

func (r UserRepository) GetBySession(sessionScope, id string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT "User"."id", "User"."username", "User"."passwordHash", "User"."firstName", "User"."lastName", "User"."createdAt"
			FROM "User"
			INNER JOIN "Session"
			ON "User"."id" = "Session"."userId"
			WHERE "Session"."id" = $1
			AND "Session"."scope" = $2
			AND "Session"."expiry" > $3;`

	args := []interface{}{id, sessionScope, time.Now()}

	var user User

	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&user.Id,
		&user.Username,
		&user.Password.hash,
		&user.FirstName,
		&user.LastName,
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
