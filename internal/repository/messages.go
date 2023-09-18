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

type MessageRepository struct {
	db *sql.DB
}

type MessagePart struct {
	Headers map[string]interface{} `json:"headers,omitempty"`
	Body    *Body                  `json:"body,omitempty"`
	Parts   []*MessagePart         `json:"parts,omitempty"`
}

type Message struct {
	Id         string       `json:"id"`
	UserId     int64        `json:"-"`
	Unread     bool         `json:"unread"`
	Starred    bool         `json:"starred"`
	Folder     int16        `json:"folder"`
	Payload    *MessagePart `json:"payload,omitempty"`
	LabelIds   *string      `json:"labelIds"`
	SentAt     *Timestamp   `json:"sentAt"`
	ReceivedAt *Timestamp   `json:"receivedAt"`
	SnoozedAt  *Timestamp   `json:"snoozedAt"`
	CreatedAt  Timestamp    `json:"createdAt"`
	ModifiedAt *Timestamp   `json:"modifiedAt"`
	TimelineId int64        `json:"-"`
	HistoryId  int64        `json:"-"`
	LastStmt   int          `json:"-"`
	DeviceId   *string      `json:"-"`
}

type MessageDeleted struct {
	Id        string  `json:"id"`
	UserId    int64   `json:"-"`
	HistoryId int64   `json:"-"`
	DeviceId  *string `json:"-"`
}

type MessageList struct {
	History  int64      `json:"lastHistoryId"`
	Messages []*Message `json:"messages"`
}

type MessageSync struct {
	History          int64             `json:"lastHistoryId"`
	MessagesInserted []*Message        `json:"inserted"`
	MessagesUpdated  []*Message        `json:"updated"`
	MessagesTrashed  []*Message        `json:"trashed"`
	MessagesDeleted  []*MessageDeleted `json:"deleted"`
}

type Body struct {
	Data string `json:"data"`
}

func (v MessagePart) Value() (driver.Value, error) {
	return json.Marshal(v)
}

func (v *MessagePart) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(b, &v)
}

func (c *Message) Scan() []interface{} {
	s := reflect.ValueOf(c).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (c *MessageDeleted) Scan() []interface{} {
	s := reflect.ValueOf(c).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (r *MessageRepository) List(user *User, folder int) (*MessageList, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
		SELECT *
			FROM "Message"
			WHERE "userId" = $1 AND
			CASE WHEN $2 == 0 THEN "folder" > $2 ELSE "folder" == $2 END AND
			"lastStmt" < 2
			ORDER BY CASE WHEN "modifiedAt" IS NOT NULL THEN "modifiedAt" ELSE "createdAt" END DESC;`

	args := []interface{}{user.Id, folder}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	messageList := &MessageList{
		Messages: []*Message{},
	}

	for rows.Next() {
		var message Message

		err := rows.Scan(message.Scan()...)

		if err != nil {
			return nil, err
		}

		messageList.Messages = append(messageList.Messages, &message)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
	SELECT "lastHistoryId"
	   FROM "MessageHistorySeq"
	   WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&messageList.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return messageList, nil
}

func (r *MessageRepository) Sync(user *User, history *History) (*MessageSync, error) {
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
			FROM "Message"
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

	messageSync := &MessageSync{
		MessagesInserted: []*Message{},
		MessagesUpdated:  []*Message{},
		MessagesTrashed:  []*Message{},
		MessagesDeleted:  []*MessageDeleted{},
	}

	for rows.Next() {
		var message Message

		err := rows.Scan(message.Scan()...)

		if err != nil {
			return nil, err
		}

		messageSync.MessagesInserted = append(messageSync.MessagesInserted, &message)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// updated rows
	query = `
		SELECT *
			FROM "Message"
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
		var message Message

		err := rows.Scan(message.Scan()...)

		if err != nil {
			return nil, err
		}

		messageSync.MessagesUpdated = append(messageSync.MessagesUpdated, &message)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// trashed rows
	query = `
		SELECT *
			FROM "Message"
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
		var message Message

		err := rows.Scan(message.Scan()...)

		if err != nil {
			return nil, err
		}

		messageSync.MessagesTrashed = append(messageSync.MessagesTrashed, &message)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// deleted rows
	query = `
		SELECT *
			FROM "MessageDeleted"
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
		var messageDeleted MessageDeleted

		err := rows.Scan(messageDeleted.Scan()...)

		if err != nil {
			return nil, err
		}

		messageSync.MessagesDeleted = append(messageSync.MessagesDeleted, &messageDeleted)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
	SELECT "LastHistoryId"
	   FROM "MessageHistorySeq"
	   WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&messageSync.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return messageSync, nil
}

func (r *MessageRepository) Update(user *User, state *State) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(state.Ids) > 0 {
		var query string
		var args []interface{}

		prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

		body, err := json.Marshal(&state)
		if err != nil {
			return err
		}

		idsString := string(body)

		if state.Unread != nil && state.Starred != nil {
			query = `
			UPDATE Message
				SET "unread" = $1,
					"starred" = $2,
					"deviceId" = $3
				WHERE "userId" = $4 AND
				"id" IN (SELECT value FROM json_each($5, '$.ids')) AND
				"lastStmt" <> 2;`
			args = []interface{}{state.Unread, state.Starred, prefixedDeviceId, user.Id, idsString}
		} else if state.Unread == nil && state.Starred != nil {
			query = `
			UPDATE Message
				SET "starred" = $1,
					"deviceId" = $2
				WHERE "userId" = $3 AND
				"id" IN (SELECT value FROM json_each($4, '$.ids')) AND
				"lastStmt" <> 2;`
			args = []interface{}{state.Starred, prefixedDeviceId, user.Id, idsString}
		} else if state.Unread != nil && state.Starred == nil {
			query = `
			UPDATE Message
				SET "unread" = $1,
					"deviceId" = $2
				WHERE "userId" = $3 AND
				"id" IN (SELECT value FROM json_each($4, '$.ids')) AND
				"lastStmt" <> 2;`
			args = []interface{}{state.Unread, prefixedDeviceId, user.Id, idsString}
		} else {
			return ErrMissingStateField
		}

		_, err = r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *MessageRepository) Trash(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		query := `
		UPDATE Message
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

func (r *MessageRepository) Untrash(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		query := `
		UPDATE "Message"
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

func (r MessageRepository) Delete(user *User, ids string) error {
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
			FROM "Message"
			WHERE "userId" = $1 AND
			"id" IN (SELECT value FROM json_each($2, '$.ids'));`

		args := []interface{}{user.Id, ids}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}

		query = `
		UPDATE "MessageDeleted"
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
