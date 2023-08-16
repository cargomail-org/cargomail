package repository

import (
	"context"
	"database/sql"
	"errors"
	"reflect"
	"time"
)

type BodyRepository struct {
	db *sql.DB
}

type Body struct {
	Id          string     `json:"id"`
	UserId      int64      `json:"-"`
	Uri         string     `json:"-"`
	Name        string     `json:"name"`
	Snippet     string     `json:"snippet"`
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

type BodyDeleted struct {
	Id        string  `json:"id"`
	UserId    int64   `json:"-"`
	HistoryId int64   `json:"-"`
	DeviceId  *string `json:"-"`
}

type BodyList struct {
	History int64   `json:"lastHistoryId"`
	Bodies  []*Body `json:"bodies"`
}

type BodySync struct {
	History        int64          `json:"lastHistoryId"`
	BodiesInserted []*Body        `json:"inserted"`
	BodiesUpdated  []*Body        `json:"updated"`
	BodiesTrashed  []*Body        `json:"trashed"`
	BodiesDeleted  []*BodyDeleted `json:"deleted"`
}

func (b *Body) Scan() []interface{} {
	s := reflect.ValueOf(b).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (b *BodyDeleted) Scan() []interface{} {
	s := reflect.ValueOf(b).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (r BodyRepository) Create(user *User, body *Body) (*Body, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO
			"Body" ("userId", "deviceId", "uri", "name", "snippet", "path", "contentType", "size")
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	args := []interface{}{user.Id, prefixedDeviceId, body.Uri, body.Name, body.Snippet, body.Path, body.ContentType, body.Size}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(body.Scan()...)
	if err != nil {
		return nil, err
	}

	return body, nil
}

func (r BodyRepository) List(user *User) (*BodyList, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// body
	query := `
		SELECT *
			FROM "Body"
			WHERE "userId" = $1 AND
			"lastStmt" < 2;`

	args := []interface{}{user.Id}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	bodyList := &BodyList{
		Bodies: []*Body{},
	}

	for rows.Next() {
		var body Body

		err := rows.Scan(body.Scan()...)
		if err != nil {
			return nil, err
		}

		bodyList.Bodies = append(bodyList.Bodies, &body)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
		SELECT "lastHistoryId"
			FROM "BodyHistorySeq"
			WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&bodyList.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return bodyList, nil
}

func (r *BodyRepository) Sync(user *User, history *History) (*BodySync, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// inserted rows
	query := `
		SELECT *
			FROM "Body"
			WHERE "userId" = $1 AND
				("deviceId" <> $2 OR "deviceId" IS NULL) AND
				"lastStmt" = 0 AND
				"historyId" > $3
			ORDER BY "createdAt" DESC;`

	args := []interface{}{user.Id, user.DeviceId, history.Id}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	bodySync := &BodySync{
		BodiesInserted: []*Body{},
		BodiesTrashed:  []*Body{},
		BodiesDeleted:  []*BodyDeleted{},
	}

	for rows.Next() {
		var body Body

		err := rows.Scan(body.Scan()...)

		if err != nil {
			return nil, err
		}

		bodySync.BodiesInserted = append(bodySync.BodiesInserted, &body)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// updated rows
	query = `
		SELECT *
			FROM "Body"
			WHERE "userId" = $1 AND
				"lastStmt" = 1 AND
				("deviceId" <> $2 OR "deviceId" IS NULL) AND
				"historyId" > $3
			ORDER BY "createdAt" DESC;`

	args = []interface{}{user.Id, user.DeviceId, history.Id}

	rows, err = tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var body Body

		err := rows.Scan(body.Scan()...)

		if err != nil {
			return nil, err
		}

		bodySync.BodiesUpdated = append(bodySync.BodiesUpdated, &body)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// trashed rows
	query = `
		SELECT *
			FROM "Body"
			WHERE "userId" = $1 AND
			("deviceId" <> $2 OR "deviceId" IS NULL) AND
			"lastStmt" = 2 AND
				"historyId" > $3
			ORDER BY "createdAt" DESC;`

	args = []interface{}{user.Id, user.DeviceId, history.Id}

	rows, err = tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var body Body

		err := rows.Scan(body.Scan()...)

		if err != nil {
			return nil, err
		}

		bodySync.BodiesTrashed = append(bodySync.BodiesTrashed, &body)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// deleted rows
	query = `
		SELECT *
			FROM "BodyDeleted"
			WHERE "userId" = $1 AND
			    ("deviceId" <> $2 OR "deviceId" IS NULL) AND
				"historyId" > $3;`

	args = []interface{}{user.Id, user.DeviceId, history.Id}

	rows, err = tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var bodyDeleted BodyDeleted

		err := rows.Scan(bodyDeleted.Scan()...)

		if err != nil {
			return nil, err
		}

		bodySync.BodiesDeleted = append(bodySync.BodiesDeleted, &bodyDeleted)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
	SELECT "lastHistoryId"
	   FROM "BodyHistorySeq"
	   WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&bodySync.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return bodySync, nil
}

func (r BodyRepository) Update(user *User, body *Body) (*Body, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE "Body"
			SET "uri" = $1,
				"snippet" = $2,
				"size" = $3,
				"deviceId" = $4
			WHERE "userId" = $5 AND
			      "id" = $6 AND
				  "lastStmt" <> 2
			RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	args := []interface{}{body.Uri, body.Snippet, body.Size, prefixedDeviceId, user.Id, body.Id}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(body.Scan()...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrBodyNotFound
		default:
			return nil, err
		}
	}

	return body, nil
}

func (r *BodyRepository) Trash(user *User, idList string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(idList) > 0 {
		query := `
		UPDATE "Body"
			SET "lastStmt" = 2,
				"deviceId" = $1
			WHERE "userId" = $2 AND
			"id" IN (SELECT value FROM json_each($3));`

		prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

		args := []interface{}{prefixedDeviceId, user.Id, idList}

		_, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *BodyRepository) Untrash(user *User, idList string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(idList) > 0 {
		query := `
		UPDATE "Body"
			SET "lastStmt" = 0,
				"deviceId" = $1
			WHERE "userId" = $2 AND
			"id" IN (SELECT value FROM json_each($3));`

		prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

		args := []interface{}{prefixedDeviceId, user.Id, idList}

		_, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r BodyRepository) Delete(user *User, idList string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(idList) > 0 {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer tx.Rollback()

		query := `
		DELETE
			FROM "Body"
			WHERE "userId" = $1 AND
			"id" IN (SELECT value FROM json_each($2));`

		args := []interface{}{user.Id, idList}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}

		query = `
		UPDATE "BodyDeleted"
			SET "deviceId" = $1
			WHERE "userId" = $2 AND
			"id" IN (SELECT value FROM json_each($3));`

		args = []interface{}{user.DeviceId, user.Id, idList}

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

func (r BodyRepository) GetBodyById(user *User, id string) (*Body, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT *
			FROM "Body"
			WHERE "userId" = $1 AND
				"id" = $2 AND
				"lastStmt" < 2;`

	body := &Body{}

	args := []interface{}{user.Id, id}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(body.Scan()...)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return &Body{}, nil
		}
		return &Body{}, err
	}

	return body, nil
}
