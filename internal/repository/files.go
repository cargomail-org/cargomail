package repository

import (
	"context"
	"database/sql"
	"reflect"
	"time"
)

type FileRepository struct {
	db *sql.DB
}

type File struct {
	Uri         string     `json:"uri"`
	UserId      int64      `json:"-"`
	Folder      int16      `json:"folder"`
	Digest      string     `json:"digest"`
	Name        string     `json:"name"`
	Path        string     `json:"-"`
	Size        int64      `json:"size"`
	ContentType string     `json:"contentType"`
	CreatedAt   Timestamp  `json:"createdAt"`
	ModifiedAt  *Timestamp `json:"modifiedAt"`
	TimelineId  int64      `json:"-"`
	HistoryId   int64      `json:"-"`
	LastStmt    int        `json:"-"`
	DeviceId    *string    `json:"-"`
}

type FileDeleted struct {
	Uri       string  `json:"uri"`
	UserId    int64   `json:"-"`
	HistoryId int64   `json:"-"`
	DeviceId  *string `json:"-"`
}

type FileList struct {
	History int64   `json:"lastHistoryId"`
	Files   []*File `json:"files"`
}

type FileSync struct {
	History       int64          `json:"lastHistoryId"`
	FilesInserted []*File        `json:"inserted"`
	FilesTrashed  []*File        `json:"trashed"`
	FilesDeleted  []*FileDeleted `json:"deleted"`
}

func (f *File) Scan() []interface{} {
	s := reflect.ValueOf(f).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (f *FileDeleted) Scan() []interface{} {
	s := reflect.ValueOf(f).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (r FileRepository) Create(user *User, file *File) (*File, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO
			"File" ("userId", "deviceId", "folder", "digest", "name", "path", "contentType", "size")
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	folder := 0

	args := []interface{}{user.Id, prefixedDeviceId, folder, file.Digest, file.Name, file.Path, file.ContentType, file.Size}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(file.Scan()...)
	if err != nil {
		return nil, err
	}

	return file, nil
}

func (r FileRepository) List(user *User, folder int) (*FileList, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// files
	query := `
		SELECT *
			FROM "File"
			WHERE "userId" = $1 AND
			CASE WHEN $2 == -1 THEN "folder" > $2 ELSE "folder" == $2 END AND			
			"lastStmt" < 2
			ORDER BY "createdAt" DESC;`

	args := []interface{}{user.Id, folder}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	fileList := &FileList{
		Files: []*File{},
	}

	for rows.Next() {
		var file File

		err := rows.Scan(file.Scan()...)
		if err != nil {
			return nil, err
		}

		fileList.Files = append(fileList.Files, &file)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
		SELECT lastHistoryId
		   FROM fileHistorySeq
		   WHERE userId = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&fileList.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return fileList, nil
}

func (r *FileRepository) Sync(user *User, history *History) (*FileSync, error) {
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
			FROM "File"
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

	fileSync := &FileSync{
		FilesInserted: []*File{},
		FilesTrashed:  []*File{},
		FilesDeleted:  []*FileDeleted{},
	}

	for rows.Next() {
		var file File

		err := rows.Scan(file.Scan()...)

		if err != nil {
			return nil, err
		}

		fileSync.FilesInserted = append(fileSync.FilesInserted, &file)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// trashed rows
	query = `
		SELECT *
			FROM "File"
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
		var file File

		err := rows.Scan(file.Scan()...)

		if err != nil {
			return nil, err
		}

		fileSync.FilesTrashed = append(fileSync.FilesTrashed, &file)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// deleted rows
	query = `
		SELECT *
			FROM "FileDeleted"
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
		var fileDeleted FileDeleted

		err := rows.Scan(fileDeleted.Scan()...)

		if err != nil {
			return nil, err
		}

		fileSync.FilesDeleted = append(fileSync.FilesDeleted, &fileDeleted)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
	SELECT "LastHistoryId"
	   FROM "fileHistorySeq"
	   WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&fileSync.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return fileSync, nil
}

func (r *FileRepository) Trash(user *User, uris string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(uris) > 0 {
		query := `
		UPDATE "File"
			SET "lastStmt" = 2,
				"deviceId" = $1
			WHERE "userId" = $2 AND
			"uri" IN (SELECT value FROM json_each($3, '$.uris'));`

		prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

		args := []interface{}{prefixedDeviceId, user.Id, uris}

		_, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *FileRepository) Untrash(user *User, uris string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(uris) > 0 {
		query := `
		UPDATE "File"
			SET "lastStmt" = 0,
				"deviceId" = $1
			WHERE "userId" = $2 AND
			"uri" IN (SELECT value FROM json_each($3, '$.uris'));`

		prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

		args := []interface{}{prefixedDeviceId, user.Id, uris}

		_, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r FileRepository) Delete(user *User, uris string) (*[]File, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	files := []File{}

	if len(uris) > 0 {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return nil, err
		}
		defer tx.Rollback()

		query := `
		DELETE
			FROM "File"
			WHERE "userId" = $1 AND
			"uri" IN (SELECT value FROM json_each($2, '$.uris'))
			RETURNING * ;`

		file := File{}

		args := []interface{}{user.Id, uris}

		err = tx.QueryRowContext(ctx, query, args...).Scan(file.Scan()...)
		if err != nil {
			if err.Error() == "sql: no rows in result set" {
				return &[]File{}, nil
			}
			return nil, err
		}

		files = append(files, file)

		query = `
		UPDATE "FileDeleted"
			SET "deviceId" = $1
			WHERE "userId" = $2 AND
			"uri" IN (SELECT value FROM json_each($3, '$.uris'));`

		args = []interface{}{user.DeviceId, user.Id, uris}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return nil, err
		}

		if err = tx.Commit(); err != nil {
			return nil, err
		}
	}

	return &files, nil
}

func (r FileRepository) GetFileByUri(user *User, uri string) (*File, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT *
			FROM "File"
			WHERE "userId" = $1 AND
				"uri" = $2 AND
				"lastStmt" < 2;`

	file := &File{}

	args := []interface{}{user.Id, uri}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(file.Scan()...)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return &File{}, nil
		}
		return &File{}, err
	}

	return file, nil
}

func (r FileRepository) GetFileByDigest(user *User, digest string) (*File, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT *
			FROM "File"
			WHERE "userId" = $1 AND
				"digest" = $2 AND
				"lastStmt" < 2;`

	file := &File{}

	args := []interface{}{user.Id, digest}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(file.Scan()...)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return &File{}, nil
		}
		return &File{}, err
	}

	return file, nil
}
