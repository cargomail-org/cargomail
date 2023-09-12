package repository

import (
	"cargomail/internal/config"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/mail"
	"reflect"
	"strings"
	"time"

	"github.com/google/uuid"
)

type DraftRepository struct {
	db *sql.DB
}

type Draft struct {
	Uri        string       `json:"uri"`
	UserId     int64        `json:"-"`
	MessageUid string       `json:"messageUid"`
	ParentUid  *string      `json:"parentUid"`
	ThreadUid  string       `json:"threadUid"`
	Unread     bool         `json:"unread"`
	Starred    bool         `json:"starred"`
	Payload    *MessagePart `json:"payload,omitempty"`
	LabelIds   *string      `json:"labelIds"`
	CreatedAt  Timestamp    `json:"createdAt"`
	ModifiedAt *Timestamp   `json:"modifiedAt"`
	TimelineId int64        `json:"-"`
	HistoryId  int64        `json:"-"`
	LastStmt   int          `json:"-"`
	DeviceId   *string      `json:"-"`
}

type DraftDeleted struct {
	Uri       string  `json:"uri"`
	UserId    int64   `json:"-"`
	HistoryId int64   `json:"-"`
	DeviceId  *string `json:"-"`
}

type DraftList struct {
	History int64    `json:"lastHistoryId"`
	Drafts  []*Draft `json:"drafts"`
}

type DraftSync struct {
	History        int64           `json:"lastHistoryId"`
	DraftsInserted []*Draft        `json:"inserted"`
	DraftsUpdated  []*Draft        `json:"updated"`
	DraftsTrashed  []*Draft        `json:"trashed"`
	DraftsDeleted  []*DraftDeleted `json:"deleted"`
}

func (d *Draft) Scan() []interface{} {
	s := reflect.ValueOf(d).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (c *DraftDeleted) Scan() []interface{} {
	s := reflect.ValueOf(c).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (r *DraftRepository) Create(user *User, draft *Draft) (*Draft, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT
			INTO "Draft" ("userId",
				 "deviceId",
				 "messageUid",
				 "threadUid",
				 "unread",
				 "payload")
			VALUES ($1,
					$2,
					$3,
					$4,
					$5,
					$6)
			RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	// from := user.FullnameAndAddress()
	messageUid := uuid.NewString()
	threadUid := uuid.NewString()
	unread := false

	args := []interface{}{user.Id,
		prefixedDeviceId,
		messageUid,
		threadUid,
		unread,
		draft.Payload}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(draft.Scan()...)
	if err != nil {
		return nil, err
	}

	return draft, nil
}

func (r *DraftRepository) List(user *User) (*DraftList, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
		SELECT *
			FROM "Draft"
			WHERE "userId" = $1 AND
			"lastStmt" < 2
			ORDER BY CASE WHEN "modifiedAt" IS NOT NULL THEN "modifiedAt" ELSE "createdAt" END DESC;`

	args := []interface{}{user.Id}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	draftList := &DraftList{
		Drafts: []*Draft{},
	}

	for rows.Next() {
		var draft Draft

		err := rows.Scan(draft.Scan()...)

		if err != nil {
			return nil, err
		}

		draftList.Drafts = append(draftList.Drafts, &draft)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
	SELECT "lastHistoryId"
	   FROM "DraftHistorySeq"
	   WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&draftList.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return draftList, nil
}

func (r *DraftRepository) Sync(user *User, history *History) (*DraftSync, error) {
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
			FROM "Draft"
			WHERE "userId" = $1 AND
				"lastStmt" = 0 AND
				("deviceId" <> $2 OR "deviceId" IS NULL) AND
				"historyId" > $3
			ORDER BY "createdAt" DESC;`

	args := []interface{}{user.Id, user.DeviceId, history.Id}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	draftSync := &DraftSync{
		DraftsInserted: []*Draft{},
		DraftsUpdated:  []*Draft{},
		DraftsTrashed:  []*Draft{},
		DraftsDeleted:  []*DraftDeleted{},
	}

	for rows.Next() {
		var draft Draft

		err := rows.Scan(draft.Scan()...)

		if err != nil {
			return nil, err
		}

		draftSync.DraftsInserted = append(draftSync.DraftsInserted, &draft)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// updated rows
	query = `
		SELECT *
			FROM "Draft"
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
		var draft Draft

		err := rows.Scan(draft.Scan()...)

		if err != nil {
			return nil, err
		}

		draftSync.DraftsUpdated = append(draftSync.DraftsUpdated, &draft)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// trashed rows
	query = `
		SELECT *
			FROM "Draft"
			WHERE "userId" = $1 AND
				"lastStmt" = 2 AND
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
		var draft Draft

		err := rows.Scan(draft.Scan()...)

		if err != nil {
			return nil, err
		}

		draftSync.DraftsTrashed = append(draftSync.DraftsTrashed, &draft)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// deleted rows
	query = `
		SELECT *
			FROM "DraftDeleted"
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
		var draftDeleted DraftDeleted

		err := rows.Scan(draftDeleted.Scan()...)

		if err != nil {
			return nil, err
		}

		draftSync.DraftsDeleted = append(draftSync.DraftsDeleted, &draftDeleted)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	// history
	query = `
	SELECT "LastHistoryId"
	   FROM "DraftHistorySeq"
	   WHERE "userId" = $1 ;`

	args = []interface{}{user.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&draftSync.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return draftSync, nil
}

func (r *DraftRepository) Update(user *User, draft *Draft) (*Draft, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE "Draft"
			SET "payload" = $1,
				"deviceId" = $2
			WHERE "userId" = $3 AND
			      "uri" = $4 AND
				  "lastStmt" <> 2
			RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	args := []interface{}{draft.Payload, prefixedDeviceId, user.Id, draft.Uri}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(draft.Scan()...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrDraftNotFound
		default:
			return nil, err
		}
	}

	return draft, nil
}

func (r *DraftRepository) Trash(user *User, uris string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(uris) > 0 {
		query := `
		UPDATE Draft
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

func (r *DraftRepository) Untrash(user *User, uris string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(uris) > 0 {
		query := `
		UPDATE "Draft"
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

func (r DraftRepository) Delete(user *User, uris string) error {
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
			FROM "Draft"
			WHERE "userId" = $1 AND
			"uri" IN (SELECT value FROM json_each($2, '$.uris'));`

		args := []interface{}{user.Id, uris}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}

		query = `
		UPDATE "DraftDeleted"
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

func validSender(user *User, sender string) bool {
	s := strings.SplitAfter(sender, "<")
	for k, v := range s {
		if k > 0 {
			sender := strings.TrimRight(v, ">")

			_, err := mail.ParseAddress(sender)
			if err != nil {
				return false
			}

			if !strings.EqualFold(sender, user.Username+"@"+config.Configuration.DomainName) {
				return false
			}
		}
	}

	return len(s) == 2
}

func validRecipients(recipients string) bool {
	s := strings.SplitAfter(recipients, "<")
	for k, v := range s {
		if k > 0 {
			recipient := strings.Split(v, ">")

			_, err := mail.ParseAddress(recipient[0])
			if err != nil {
				return false
			}
		}
	}

	return len(s) > 1
}

func (r DraftRepository) Send(user *User, draft *Draft) (*Message, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	t := time.Now()
	draft.Payload.Headers["Date"] = t.Format(time.UnixDate)

	from := fmt.Sprintf("%v", draft.Payload.Headers["From"])
	to := fmt.Sprintf("%v", draft.Payload.Headers["To"])
	
	var cc string
	var bcc string

	if val, ok := draft.Payload.Headers["Cc"]; ok {
		cc = fmt.Sprintf("%v", val)
	}

	if val, ok := draft.Payload.Headers["Bcc"]; ok {
		bcc = fmt.Sprintf("%v", val)
	}

	if len(from) == 0 {
		return nil, ErrMissingSender
	}

	if !validSender(user, from) {
		return nil, ErrInvalidSender
	}

	if len(to) == 0 {
		return nil, ErrMissingRecipients
	}

	if !validRecipients(to) {
		return nil, ErrInvalidRecipients
	}

	if len(cc) > 0 && !validRecipients(cc) {
		return nil, ErrInvalidRecipients
	}

	if len(bcc) > 0 && !validRecipients(bcc) {
		return nil, ErrInvalidRecipients
	}

	message := &Message{}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return message, err
	}
	defer tx.Rollback()

	query := `
	UPDATE "Draft"
		SET "payload" = $1,
			"deviceId" = $2
		WHERE "userId" = $3 AND
			  "uri" = $4 AND
			  "lastStmt" <> 2
		RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	args := []interface{}{draft.Payload, prefixedDeviceId, user.Id, draft.Uri}

	err = tx.QueryRowContext(ctx, query, args...).Scan(draft.Scan()...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrDraftNotFound
		default:
			return nil, err
		}
	}

	query = `
	INSERT
		INTO "Message" ("userId",
			 "deviceId",
			 "messageUid",
			 "threadUid",
			 "unread",
			 "folder",
			 "payload")
		VALUES ($1,
				$2,
				$3,
				$4,
				$5,
				$6,
				$7)
		RETURNING * ;`

	// from := user.FullnameAndAddress()
	messageUid := uuid.NewString() // ???
	threadUid := draft.ThreadUid
	unread := false
	folder := 1 // sent

	args = []interface{}{user.Id,
		prefixedDeviceId,
		messageUid,
		threadUid,
		unread,
		folder,
		draft.Payload}

	err = tx.QueryRowContext(ctx, query, args...).Scan(message.Scan()...)
	if err != nil {
		return nil, err
	}

	query = `
	DELETE
		FROM "Draft"
		WHERE "userId" = $1 AND
		"uri" = $2;`

	args = []interface{}{user.Id, draft.Uri}

	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	query = `
	UPDATE "DraftDeleted"
		SET "deviceId" = $1
		WHERE "userId" = $2 AND
		"uri" = $3;`

	args = []interface{}{user.DeviceId, user.Id, draft.Uri}

	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return message, err
	}

	return message, nil
}
