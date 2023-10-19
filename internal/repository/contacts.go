package repository

import (
	"context"
	"database/sql"
	"errors"
	"reflect"
	"time"
)

type ContactDepository interface {
	Create(user *User, contact *Contact) (*Contact, error)
	List(user *User) (*ContactList, error)
	Sync(user *User, history *History) (*ContactSync, error)
	Update(user *User, contact *Contact) (*Contact, error)
	Trash(user *User, ids string) error
	Untrash(user *User, ids string) error
	Delete(user *User, ids string) error
}

type ContactRepository struct {
	db *sql.DB
}

type Contact struct {
	Id           string     `json:"id"`
	UserId       int64      `json:"-"`
	EmailAddress *string    `json:"emailAddress"`
	FirstName    *string    `json:"firstName"`
	LastName     *string    `json:"lastName"`
	CreatedAt    Timestamp  `json:"createdAt"`
	ModifiedAt   *Timestamp `json:"modifiedAt"`
	TimelineId   int64      `json:"-"`
	HistoryId    int64      `json:"-"`
	LastStmt     int        `json:"-"`
	DeviceId     *string    `json:"-"`
}

type ContactDeleted struct {
	Id        string  `json:"id"`
	UserId    int64   `json:"-"`
	HistoryId int64   `json:"-"`
	DeviceId  *string `json:"-"`
}

type ContactList struct {
	History  int64      `json:"lastHistoryId"`
	Contacts []*Contact `json:"contacts"`
}

type ContactSync struct {
	History          int64             `json:"lastHistoryId"`
	ContactsInserted []*Contact        `json:"inserted"`
	ContactsUpdated  []*Contact        `json:"updated"`
	ContactsTrashed  []*Contact        `json:"trashed"`
	ContactsDeleted  []*ContactDeleted `json:"deleted"`
}

func (c *Contact) Scan() []interface{} {
	s := reflect.ValueOf(c).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (c *ContactDeleted) Scan() []interface{} {
	s := reflect.ValueOf(c).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (r *ContactRepository) Create(user *User, contact *Contact) (*Contact, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT
			INTO "Contact" ("userId", "deviceId", "emailAddress", "firstName", "lastName")
			VALUES ($1, $2, $3, $4, $5)
			RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	args := []interface{}{user.Id, prefixedDeviceId, contact.EmailAddress, contact.FirstName, contact.LastName}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(contact.Scan()...)
	if err != nil {
		switch {
		case err.Error() == `UNIQUE constraint failed: Contact.emailAddress`:
			return nil, ErrDuplicateContact
		case err.Error() == `CHECK constraint failed: emailAddress`:
			return nil, ErrInvalidEmailAddress
		default:
			return nil, err
		}
	}

	return contact, nil
}

func (r *ContactRepository) List(user *User) (*ContactList, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
		SELECT *
			FROM "Contact"
			WHERE "userId" = $1 AND
			"lastStmt" < 2
			ORDER BY "createdAt" DESC;`

	args := []interface{}{user.Id}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	contactList := &ContactList{
		Contacts: []*Contact{},
	}

	for rows.Next() {
		var contact Contact

		err := rows.Scan(contact.Scan()...)

		if err != nil {
			return nil, err
		}

		contactList.Contacts = append(contactList.Contacts, &contact)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
	SELECT "lastHistoryId"
	   FROM "ContactHistorySeq"
	   WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&contactList.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return contactList, nil
}

func (r *ContactRepository) Sync(user *User, history *History) (*ContactSync, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var deviceId string

	if !history.IgnoreDevice {
		deviceId = *user.DeviceId
	}

	// inserted rows
	query := `
		SELECT *
			FROM "Contact"
			WHERE "userId" = $1 AND
				"lastStmt" = 0 AND
				("deviceId" <> $2 OR "deviceId" IS NULL) AND
				"historyId" > $3
			ORDER BY "createdAt" DESC;`

	args := []interface{}{user.Id, deviceId, history.Id}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	contactSync := &ContactSync{
		ContactsInserted: []*Contact{},
		ContactsUpdated:  []*Contact{},
		ContactsTrashed:  []*Contact{},
		ContactsDeleted:  []*ContactDeleted{},
	}

	for rows.Next() {
		var contact Contact

		err := rows.Scan(contact.Scan()...)

		if err != nil {
			return nil, err
		}

		contactSync.ContactsInserted = append(contactSync.ContactsInserted, &contact)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// updated rows
	query = `
		SELECT *
			FROM "Contact"
			WHERE "userId" = $1 AND
				"lastStmt" = 1 AND
				("deviceId" <> $2 OR "deviceId" IS NULL) AND
				"historyId" > $3
			ORDER BY "createdAt" DESC;`

	args = []interface{}{user.Id, deviceId, history.Id}

	rows, err = tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var contact Contact

		err := rows.Scan(contact.Scan()...)

		if err != nil {
			return nil, err
		}

		contactSync.ContactsUpdated = append(contactSync.ContactsUpdated, &contact)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// trashed rows
	query = `
		SELECT *
			FROM "Contact"
			WHERE "userId" = $1 AND
				"lastStmt" = 2 AND
				("deviceId" <> $2 OR "deviceId" IS NULL) AND
				"historyId" > $3
			ORDER BY "createdAt" DESC;`

	args = []interface{}{user.Id, deviceId, history.Id}

	rows, err = tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var contact Contact

		err := rows.Scan(contact.Scan()...)

		if err != nil {
			return nil, err
		}

		contactSync.ContactsTrashed = append(contactSync.ContactsTrashed, &contact)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// deleted rows
	query = `
		SELECT *
			FROM "ContactDeleted"
			WHERE "userId" = $1 AND
			("deviceId" <> $2 OR "deviceId" IS NULL) AND
			"historyId" > $3;`

	args = []interface{}{user.Id, deviceId, history.Id}

	rows, err = tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var contactDeleted ContactDeleted

		err := rows.Scan(contactDeleted.Scan()...)

		if err != nil {
			return nil, err
		}

		contactSync.ContactsDeleted = append(contactSync.ContactsDeleted, &contactDeleted)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
	SELECT "LastHistoryId"
	   FROM "contactHistorySeq"
	   WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&contactSync.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return contactSync, nil
}

func (r *ContactRepository) Update(user *User, contact *Contact) (*Contact, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
		UPDATE "Contact"
			SET "emailAddress" = $1,
			    "firstName" = $2,
				"lastName" = $3,
				"deviceId" = $4
			WHERE "userId" = $5 AND
			      "id" = $6 AND
				  "lastStmt" <> 2
			RETURNING id ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	args := []interface{}{contact.EmailAddress, contact.FirstName, contact.LastName, prefixedDeviceId, user.Id, contact.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&contact.Id)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrContactNotFound
		case err.Error() == `UNIQUE constraint failed: Contact.emailAddress`:
			return nil, ErrDuplicateContact
		case err.Error() == `CHECK constraint failed: emailAddress`:
			return nil, ErrInvalidEmailAddress
		default:
			return nil, err
		}
	}

	query = `
	SELECT *
		FROM "Contact"
		WHERE "userId" = $1 AND
		"id" = $2 AND
		"lastStmt" <> 2;`

	args = []interface{}{user.Id, contact.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(contact.Scan()...)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return contact, nil
}

func (r *ContactRepository) Trash(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		query := `
		UPDATE "Contact"
			SET "lastStmt" = 2,
			"deviceId" = $1
			WHERE "userId" = $2 AND
			"id" IN (SELECT value FROM json_each($3, '$.ids'));`

		prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

		args := []interface{}{prefixedDeviceId, user.Id, ids}

		_, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *ContactRepository) Untrash(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		query := `
		UPDATE "Contact"
			SET "lastStmt" = 0,
			"deviceId" = $1
			WHERE "userId" = $2 AND
			"id" IN (SELECT value FROM json_each($3, '$.ids'));`

		prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

		args := []interface{}{prefixedDeviceId, user.Id, ids}

		_, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r ContactRepository) Delete(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer tx.Rollback()

		query := `
		DELETE
			FROM "Contact"
			WHERE "userId" = $1 AND
			"id" IN (SELECT value FROM json_each($2, '$.ids'));`

		args := []interface{}{user.Id, ids}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}

		query = `
		UPDATE "ContactDeleted"
			SET "deviceId" = $1
			WHERE "userId" = $2 AND
			"id" IN (SELECT value FROM json_each($3, '$.ids'));`

		args = []interface{}{user.DeviceId, user.Id, ids}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}

		if err = tx.Commit(); err != nil {
			return err
		}
	}

	return nil
}
