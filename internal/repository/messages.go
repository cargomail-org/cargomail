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
	Headers map[string]interface{} `json:"headers"`
	Body    *Body                  `json:"body,omitempty"`
	Parts   []*MessagePart         `json:"parts,omitempty"`
}

type Message struct {
	Uri        string       `json:"uri"`
	UserId     int64        `json:"-"`
	MessageUid string       `json:"messageUid"`
	ParentUid  *string      `json:"parentUid"`
	ThreadUid  string       `json:"threadUid"`
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
	Uri       string  `json:"uri"`
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
	ContentType string `json:"contentType,omitempty"`
	Uri         string `json:"uri,omitempty"`
	Raw         string `json:"raw,omitempty"`
	Hash        string `json:"hash,omitempty"`
	Size        int64  `json:"size,omitempty"`
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

func (r *MessageRepository) List(user *User) (*MessageList, error) {
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
			"folder" > 0 AND
			"lastStmt" < 2
			ORDER BY CASE WHEN "modifiedAt" IS NOT NULL THEN "modifiedAt" ELSE "createdAt" END DESC;`

	args := []interface{}{user.Id}

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

func (r MessageRepository) Delete(user *User, uris string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(uris) > 0 {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer tx.Rollback()

		query := `
		DELETE
			FROM "Message"
			WHERE "userId" = $1 AND
			"uri" IN (SELECT value FROM json_each($2, '$.uris'));`

		args := []interface{}{user.Id, uris}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}

		query = `
		UPDATE "MessageDeleted"
			SET "deviceId" = $1
			WHERE "userId" = $2 AND
			"uri" IN (SELECT value FROM json_each($3, '$.uris'));`

		args = []interface{}{user.DeviceId, user.Id, uris}

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
