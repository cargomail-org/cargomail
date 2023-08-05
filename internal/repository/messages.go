package repository

import (
	"context"
	"database/sql"
	"reflect"
	"time"
)

type MessagesRepository struct {
	db *sql.DB
}

type Message struct {
	Id             string     `json:"id"`
	UserId         int64      `json:"-"`
	MessageUid     string     `json:"message_uid"`
	ParentUid      *string    `json:"parent_uid"`
	ThreadUid      string     `json:"thread_uid"`
	Forwarded      bool       `json:"forwarded"`
	Unread         bool       `json:"unread"`
	Starred        bool       `json:"starred"`
	Folder         int16      `json:"folder"`
	UserLabelIds   *string    `json:"user_label_ids"`
	SharedLabelIds *string    `json:"shared_label_ids"`
	From           string     `json:"from"`
	To             *string    `json:"to"`
	Cc             *string    `json:"cc"`
	Bcc            *string    `json:"bcc"`
	Group          *string    `json:"group"`
	Subject        *string    `json:"subject"`
	OriginUrl      *string    `json:"origin_url"`
	DesinationUrl  *string    `json:"desination_url"`
	Tags           *string    `json:"tags"`
	Cargoes        *string    `json:"cargoes"`
	Snippet        *string    `json:"snippet"`
	BodyMimetype   *string    `json:"body_mimetype"`
	BodyUri        *string    `json:"body_uri"`
	BodySize       *int64     `json:"body_size"`
	SentAt         *Timestamp `json:"sent_at"`
	ReceivedAt     *Timestamp `json:"received_at"`
	SnoozedAt      *Timestamp `json:"snoozed_at"`
	CreatedAt      Timestamp  `json:"created_at"`
	ModifiedAt     *Timestamp `json:"modified_at"`
	TimelineId     int64      `json:"-"`
	HistoryId      int64      `json:"-"`
	LastStmt       int        `json:"-"`
	DeviceId       *string    `json:"-"`
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
