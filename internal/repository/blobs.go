package repository

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"reflect"
	"time"
)

type UseBlobRepository interface {
	Create(user *User, blob *Blob) (*Blob, error)
	List(user *User, folder int) (*BlobList, error)
	Sync(user *User, history *History) (*BlobSync, error)
	Update(user *User, blob *Blob) (*Blob, error)
	Trash(user *User, ids string) error
	Untrash(user *User, ids string) error
	Delete(user *User, ids string) (*[]Blob, error)
	GetById(user *User, id string) (*Blob, error)
	GetByDigest(user *User, digest string) (*Blob, error)
}

type BlobRepository struct {
	db *sql.DB
}

type BlobMetadata struct {
	Key string `json:"key"`
	Iv  string `json:"iv"`
}

type Blob struct {
	Id          string        `json:"id"`
	UserId      int64         `json:"-"`
	Folder      int16         `json:"folder"`
	Digest      string        `json:"digest"`
	Name        string        `json:"name"`
	Snippet     string        `json:"snippet"`
	Path        string        `json:"-"`
	Size        int64         `json:"size"`
	Metadata    *BlobMetadata `json:"-"`
	ContentType string        `json:"contentType"`
	CreatedAt   Timestamp     `json:"createdAt"`
	ModifiedAt  *Timestamp    `json:"modifiedAt"`
	TimelineId  int64         `json:"-"`
	HistoryId   int64         `json:"-"`
	LastStmt    int           `json:"-"`
	DeviceId    *string       `json:"-"`
}

type BlobDeleted struct {
	Id        string  `json:"id"`
	UserId    int64   `json:"-"`
	HistoryId int64   `json:"-"`
	DeviceId  *string `json:"-"`
}

type BlobList struct {
	History int64   `json:"lastHistoryId"`
	Blobs   []*Blob `json:"blobs"`
}

type BlobSync struct {
	History       int64          `json:"lastHistoryId"`
	BlobsInserted []*Blob        `json:"inserted"`
	BlobsUpdated  []*Blob        `json:"updated"`
	BlobsTrashed  []*Blob        `json:"trashed"`
	BlobsDeleted  []*BlobDeleted `json:"deleted"`
}

func (v BlobMetadata) Value() (driver.Value, error) {
	return json.Marshal(v)
}

func (v *BlobMetadata) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(b, &v)
}

func (b *Blob) Scan() []interface{} {
	s := reflect.ValueOf(b).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (b *BlobDeleted) Scan() []interface{} {
	s := reflect.ValueOf(b).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (r BlobRepository) Create(user *User, blob *Blob) (*Blob, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO
			"Blob" ("userId", "deviceId", "folder", "digest", "name", "snippet", "path", "contentType", "size", "metadata")
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	folder := 0

	args := []interface{}{user.Id, prefixedDeviceId, folder, blob.Digest, blob.Name, blob.Snippet, blob.Path, blob.ContentType, blob.Size, blob.Metadata}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(blob.Scan()...)
	if err != nil {
		return nil, err
	}

	return blob, nil
}

func (r BlobRepository) List(user *User, folder int) (*BlobList, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// blob
	query := `
		SELECT *
			FROM "Blob"
			WHERE "userId" = $1 AND
			CASE WHEN $2 == -1 THEN "folder" > $2 ELSE "folder" == $2 END AND			
			"lastStmt" < 2;`

	args := []interface{}{user.Id, folder}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	blobList := &BlobList{
		Blobs: []*Blob{},
	}

	for rows.Next() {
		var blob Blob

		err := rows.Scan(blob.Scan()...)
		if err != nil {
			return nil, err
		}

		blobList.Blobs = append(blobList.Blobs, &blob)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
		SELECT "lastHistoryId"
			FROM "BlobHistorySeq"
			WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&blobList.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return blobList, nil
}

func (r *BlobRepository) Sync(user *User, history *History) (*BlobSync, error) {
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
			FROM "Blob"
			WHERE "userId" = $1 AND
				("deviceId" <> $2 OR "deviceId" IS NULL) AND
				"lastStmt" = 0 AND
				"historyId" > $3
			ORDER BY "createdAt" DESC;`

	args := []interface{}{user.Id, deviceId, history.Id}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	blobSync := &BlobSync{
		BlobsInserted: []*Blob{},
		BlobsUpdated:  []*Blob{},
		BlobsTrashed:  []*Blob{},
		BlobsDeleted:  []*BlobDeleted{},
	}

	for rows.Next() {
		var blob Blob

		err := rows.Scan(blob.Scan()...)

		if err != nil {
			return nil, err
		}

		blobSync.BlobsInserted = append(blobSync.BlobsInserted, &blob)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// updated rows
	query = `
		SELECT *
			FROM "Blob"
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
		var blob Blob

		err := rows.Scan(blob.Scan()...)

		if err != nil {
			return nil, err
		}

		blobSync.BlobsUpdated = append(blobSync.BlobsUpdated, &blob)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// trashed rows
	query = `
		SELECT *
			FROM "Blob"
			WHERE "userId" = $1 AND
			("deviceId" <> $2 OR "deviceId" IS NULL) AND
			"lastStmt" = 2 AND
				"historyId" > $3
			ORDER BY "createdAt" DESC;`

	args = []interface{}{user.Id, deviceId, history.Id}

	rows, err = tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var blob Blob

		err := rows.Scan(blob.Scan()...)

		if err != nil {
			return nil, err
		}

		blobSync.BlobsTrashed = append(blobSync.BlobsTrashed, &blob)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// deleted rows
	query = `
		SELECT *
			FROM "BlobDeleted"
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
		var blobDeleted BlobDeleted

		err := rows.Scan(blobDeleted.Scan()...)

		if err != nil {
			return nil, err
		}

		blobSync.BlobsDeleted = append(blobSync.BlobsDeleted, &blobDeleted)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
	SELECT "lastHistoryId"
	   FROM "BlobHistorySeq"
	   WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&blobSync.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return blobSync, nil
}

func (r BlobRepository) Update(user *User, blob *Blob) (*Blob, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
		UPDATE "Blob"
			SET "digest" = $1,
				"snippet" = $2,
				"size" = $3,
				"deviceId" = $4
			WHERE "userId" = $5 AND
			      "id" = $6 AND
				  "lastStmt" <> 2
			RETURNING id ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	args := []interface{}{blob.Digest, blob.Snippet, blob.Size, prefixedDeviceId, user.Id, blob.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&blob.Id)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrBlobNotFound
		default:
			return nil, err
		}
	}

	query = `
	SELECT *
		FROM "Blob"
		WHERE "userId" = $1 AND
		"id" = $2 AND		
		"lastStmt" <> 2;`

	args = []interface{}{user.Id, blob.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(blob.Scan()...)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return blob, nil
}

func (r *BlobRepository) Trash(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		query := `
		UPDATE "Blob"
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

func (r *BlobRepository) Untrash(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		query := `
		UPDATE "Blob"
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

func (r BlobRepository) Delete(user *User, ids string) (*[]Blob, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	blobs := []Blob{}

	if len(ids) > 0 {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return nil, err
		}
		defer tx.Rollback()

		query := `
		DELETE
			FROM "Blob"
			WHERE "userId" = $1 AND
			"id" IN (SELECT value FROM json_each($2, '$.ids'))
			RETURNING * ;`

		blob := Blob{}

		args := []interface{}{user.Id, ids}

		err = tx.QueryRowContext(ctx, query, args...).Scan(blob.Scan()...)
		if err != nil {
			if err.Error() == "sql: no rows in result set" {
				return &[]Blob{}, nil
			}
			return nil, err
		}

		blobs = append(blobs, blob)

		query = `
		UPDATE "BlobDeleted"
			SET "deviceId" = $1
			WHERE "userId" = $2 AND
			"id" IN (SELECT value FROM json_each($3, '$.ids'));`

		args = []interface{}{user.DeviceId, user.Id, ids}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return nil, err
		}

		if err = tx.Commit(); err != nil {
			return nil, err
		}
	}

	return &blobs, nil
}

func (r BlobRepository) GetById(user *User, id string) (*Blob, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT *
			FROM "Blob"
			WHERE "userId" = $1 AND
				"id" = $2 AND
				"lastStmt" < 2;`

	blob := &Blob{}

	args := []interface{}{user.Id, id}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(blob.Scan()...)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return &Blob{}, nil
		}
		return &Blob{}, err
	}

	return blob, nil
}

func (r BlobRepository) GetByDigest(user *User, digest string) (*Blob, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT *
			FROM "Blob"
			WHERE "userId" = $1 AND
				"digest" = $2 AND
				"lastStmt" < 2
				LIMIT 1;`

	blob := &Blob{}

	args := []interface{}{user.Id, digest}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(blob.Scan()...)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return &Blob{}, nil
		}
		return &Blob{}, err
	}

	return blob, nil
}
