package repository

import (
	"context"
	"database/sql"
	"reflect"
	"time"

	"github.com/google/uuid"
)

type DraftRepository struct {
	db *sql.DB
}

type Draft Message

type DraftDeleted MessageDeleted

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

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	// from := user.FullnameAndAddress()
	messageUid := uuid.NewString()
	threadUid := uuid.NewString()
	folder := 0 // 0-draft
	unread := false

	args := []interface{}{user.Id,
		prefixedDeviceId,
		messageUid,
		threadUid,
		unread,
		folder,
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
			FROM "Message"
			WHERE "userId" = $1 AND
			"folder" = 0 AND
			"lastStmt" < 2
			ORDER BY "createdAt" DESC;`

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
	   FROM "MessageHistorySeq"
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
