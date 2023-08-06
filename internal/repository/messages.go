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

type MessagesRepository struct {
	db *sql.DB
}

type Recipient struct {
	Fullname     string `json:"fullname,omitempty"`
	EmailAddress string `json:"email_address,omitempty"`
}

type Recipients []Recipient

type Message struct {
	Id         string      `json:"id"`
	UserId     int64       `json:"-"`
	MessageUid string      `json:"message_uid"`
	ParentUid  *string     `json:"parent_uid"`
	ThreadUid  string      `json:"thread_uid"`
	Forwarded  bool        `json:"forwarded"`
	Unread     bool        `json:"unread"`
	Starred    bool        `json:"starred"`
	Folder     int16       `json:"folder"`
	Headers    *string     `json:"headers"`
	Body       *string     `json:"body"`
	Tags       *string     `json:"tags"`
	Files      *string     `json:"files"`
	From       string      `json:"from"`
	To         *Recipients `json:"to"`
	Cc         *Recipients `json:"cc"`
	Bcc        *Recipients `json:"bcc"`
	Group      *Recipients `json:"group"`
	LabelIds   *string `json:"labbel_ids"`
	SentAt     *Timestamp  `json:"sent_at"`
	ReceivedAt *Timestamp  `json:"received_at"`
	SnoozedAt  *Timestamp  `json:"snoozed_at"`
	CreatedAt  Timestamp   `json:"created_at"`
	ModifiedAt *Timestamp  `json:"modified_at"`
	TimelineId int64       `json:"-"`
	HistoryId  int64       `json:"-"`
	LastStmt   int         `json:"-"`
	DeviceId   *string     `json:"-"`
}

type MessageDeleted struct {
	Id        string  `json:"id"`
	UserId    int64   `json:"-"`
	HistoryId int64   `json:"-"`
	DeviceId  *string `json:"-"`
}

type messageAllHistory struct {
	History  int64      `json:"last_history_id"`
	Messages []*Message `json:"messages"`
}

type messageSyncHistory struct {
	History          int64             `json:"last_history_id"`
	MessagesInserted []*Message        `json:"inserted"`
	MessagesUpdated  []*Message        `json:"updated"`
	MessagesTrashed  []*Message        `json:"trashed"`
	MessagesDeleted  []*MessageDeleted `json:"deleted"`
}

func (r Recipients) Value() (driver.Value, error) {
	return json.Marshal(r)
}

func (r *Recipients) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(b, &r)
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

func (r *MessagesRepository) GetAll(user *User) (*messageAllHistory, error) {
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

	messageHistory := &messageAllHistory{
		Messages: []*Message{},
	}

	for rows.Next() {
		var message Message

		err := rows.Scan(message.Scan()...)

		if err != nil {
			return nil, err
		}

		messageHistory.Messages = append(messageHistory.Messages, &message)
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

	err = tx.QueryRowContext(ctx, query, args...).Scan(&messageHistory.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return messageHistory, nil
}
