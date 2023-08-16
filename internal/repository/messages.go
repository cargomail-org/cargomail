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

type Header struct {
	Name string      `json:"name"`
	Data interface{} `json:"value"`
}

type MessagePart struct {
	PartId      string         `json:"partId"`
	ContentType string         `json:"contentType"`
	Headers     []*Header      `json:"headers"`
	Body        *BodyResource  `json:"body"`
	Parts       []*MessagePart `json:"parts"`
}

type Message struct {
	Id         string       `json:"id"`
	UserId     int64        `json:"-"`
	MessageUid string       `json:"messageUid"`
	ParentUid  *string      `json:"parentUid"`
	ThreadUid  string       `json:"threadUid"`
	Unread     bool         `json:"unread"`
	Starred    bool         `json:"starred"`
	Folder     int16        `json:"folder"`
	Payload    *MessagePart `json:"payload"`
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

type BodyResource struct {
	ContentType string `json:"contentType"`
	Uri         string `json:"uri"`
	Size        int64  `json:"size"`
}

type FileResource struct {
	ContentType string `json:"contentType"`
	Uri         string `json:"uri"`
	Size        int64  `json:"size"`
}

type FilesResource []FileResource

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
			ORDER BY "createdAt" DESC;`

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

func (r MessageRepository) Delete(user *User, idList string) error {
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
			FROM "Message"
			WHERE "userId" = $1 AND
			"id" IN (SELECT value FROM json_each($2));`

		args := []interface{}{user.Id, idList}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}

		query = `
		UPDATE "MessageDeleted"
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
