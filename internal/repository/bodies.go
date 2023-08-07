package repository

import (
	"context"
	"database/sql"
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
	Subject     string     `json:"subject"`
	Snippet     string     `json:"snippet"`
	Path        string     `json:"-"`
	Size        int64      `json:"size"`
	ContentType string     `json:"content_type"`
	CreatedAt   Timestamp  `json:"created_at"`
	ModifiedAt  *Timestamp `json:"modified_at"`
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
	History int64   `json:"last_history_id"`
	Bodies  []*Body `json:"bodies"`
}

type BodySync struct {
	History        int64          `json:"last_history_id"`
	BodiesInserted []*Body        `json:"inserted"`
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
			body (user_id, device_id, uri, subject, snippet, path, content_type, size)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	args := []interface{}{user.Id, prefixedDeviceId, body.Uri, body.Subject, body.Snippet, body.Path, body.ContentType, body.Size}

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
			FROM body
			WHERE user_id = $1 AND
			last_stmt < 2;`

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
		SELECT last_history_id
			FROM body_history_seq
			WHERE user_id = $1 ;`

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
			FROM body
			WHERE user_id = $1 AND
				(device_id <> $2 OR device_id IS NULL) AND
				last_stmt = 0 AND
				history_id > $3
			ORDER BY created_at DESC;`

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

	// trashed rows
	query = `
		SELECT *
			FROM body
			WHERE user_id = $1 AND
			(device_id <> $2 OR device_id IS NULL) AND
			last_stmt = 2 AND
				history_id > $3
			ORDER BY created_at DESC;`

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
			FROM body_deleted
			WHERE user_id = $1 AND
			    (device_id <> $2 OR device_id IS NULL) AND
				history_id > $3;`

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
	SELECT last_history_id
	   FROM body_history_seq
	   WHERE user_id = $1 ;`

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

func (r *BodyRepository) Trash(user *User, idList string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(idList) > 0 {
		query := `
		UPDATE body
			SET last_stmt = 2,
				device_id = $1
			WHERE user_id = $2 AND
			id IN (SELECT value FROM json_each($3));`

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
		UPDATE body
			SET last_stmt = 0,
				device_id = $1
			WHERE user_id = $2 AND
			id IN (SELECT value FROM json_each($3));`

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
		query := `
		DELETE
			FROM body
			WHERE user_id = $1 AND
			id IN (SELECT value FROM json_each($2));`

		args := []interface{}{user.Id, idList}

		_, err := r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r BodyRepository) GetSubject(user *User, id string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT *
			FROM body
			WHERE user_id = $1 AND
				id = $2;`

	body := &Body{}

	args := []interface{}{user.Id, id}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(body.Scan()...)
	if err != nil {
		return "", err
	}

	return body.Subject, nil
}
