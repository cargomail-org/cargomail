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
	PartId      string         `json:"part_id"`
	ContentType string         `json:"content_type"`
	Headers     []*Header      `json:"headers"`
	Body        *BodyResource  `json:"body"`
	Files       *FilesResource `json:"files"`
	Parts       []*MessagePart `json:"parts"`
}

type Message struct {
	Id         string       `json:"id"`
	UserId     int64        `json:"-"`
	MessageUid string       `json:"message_uid"`
	ParentUid  *string      `json:"parent_uid"`
	ThreadUid  string       `json:"thread_uid"`
	Unread     bool         `json:"unread"`
	Starred    bool         `json:"starred"`
	Folder     int16        `json:"folder"`
	Payload    *MessagePart `json:"payload"`
	LabelIds   *string      `json:"label_ids"`
	SentAt     *Timestamp   `json:"sent_at"`
	ReceivedAt *Timestamp   `json:"received_at"`
	SnoozedAt  *Timestamp   `json:"snoozed_at"`
	CreatedAt  Timestamp    `json:"created_at"`
	ModifiedAt *Timestamp   `json:"modified_at"`
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
	History  int64      `json:"last_history_id"`
	Messages []*Message `json:"messages"`
}

type MessageSync struct {
	History          int64             `json:"last_history_id"`
	MessagesInserted []*Message        `json:"inserted"`
	MessagesUpdated  []*Message        `json:"updated"`
	MessagesTrashed  []*Message        `json:"trashed"`
	MessagesDeleted  []*MessageDeleted `json:"deleted"`
}

type BodyResource struct {
	ContentType string `json:"content_type"`
	Uri         string `json:"uri"`
	Size        int64  `json:"size"`
}

type FileResource struct {
	ContentType string `json:"content_type"`
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
			FROM message
			WHERE user_id = $1 AND
			folder > 0 AND
			last_stmt < 2
			ORDER BY created_at DESC;`

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
	SELECT last_history_id
	   FROM message_history_seq
	   WHERE user_id = $1 ;`

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
