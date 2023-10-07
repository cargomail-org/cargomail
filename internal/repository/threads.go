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

type ThreadRepository struct {
	db *sql.DB
}

type Messages []Message

type MessageIds []string

type Thread struct {
	ThreadId string   `json:"threadId"`
	UserId   int64    `json:"-"`
	Messages Messages `json:"messages"`
	// DeviceId *string    `json:"-"`
}

type ThreadList struct {
	History int64     `json:"lastHistoryId"`
	Threads []*Thread `json:"threads"`
}

func (m Messages) Value() (driver.Value, error) {
	return json.Marshal(m)
}

func (m *Messages) Scan(value interface{}) error {
	var dat []map[string]interface{}

	err := json.Unmarshal([]byte(value.(string)), &dat)
	if err != nil {
		return err
	}

	*m = make([]Message, 0)

	message := Message{}

	for _, v := range dat {
		message.Id = v["id"].(string)

		if v["unread"].(float64) == 1 {
			message.Unread = true
		} else {
			message.Unread = false
		}

		if v["starred"].(float64) == 1 {
			message.Starred = true
		} else {
			message.Starred = false
		}

		message.Folder = int16(v["folder"].(float64))

		b, err := json.Marshal(v["payload"])
		if err != nil {
			return errors.New("payload (marshal) conversion failed")
		}

		err = json.Unmarshal(b, &message.Payload)
		if err != nil {
			return errors.New("payload (unmarshal) conversion failed")
		}

		createdAt := v["createdAt"].(string)

		timestamp, err := time.Parse("2006-01-02 15:04:05 0000 UTC", createdAt+" 0000 UTC")
		if err != nil {
			return errors.New("timestamp conversion failed")
		}

		message.CreatedAt = Timestamp(timestamp.UnixMilli())

		*m = append(*m, message)
	}

	return nil
}

func (c *Thread) Scan() []interface{} {
	s := reflect.ValueOf(c).Elem()
	numCols := s.NumField()
	columns := make([]interface{}, numCols)
	for i := 0; i < numCols; i++ {
		field := s.Field(i)
		columns[i] = field.Addr().Interface()
	}
	return columns
}

func (r *ThreadRepository) List(user *User, folder int) (*ThreadList, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
	SELECT payload->>'$.headers.X-Thread-ID' AS "threadId",
		$1 AS "userId",
		json_group_array(json_object(
		'id', id,
		'userId', userId,
		'unread', unread,
		'starred', starred,
		'folder', folder,
		'payload', payload->'$',
		'labelIds', labelIds,
		'sentAt', sentAt,
		'receivedAt', receivedAt,
		'snoozedAt', snoozedAt,
		'createdAt', createdAt,
		'modifiedAt', modifiedAt,
		'timelineId', timelineId,
		'historyId', historyId,
		'lastStml', lastStmt,
		'deviceId', deviceId)) AS "messages"
		FROM "Message"
		WHERE "userId" = $1 AND
		CASE WHEN $2 == -1 THEN "folder" > $2 ELSE "folder" == $2 END AND
		"lastStmt" < 2
		GROUP BY payload->>'$.headers.X-Thread-ID'
		ORDER BY CASE WHEN "modifiedAt" IS NOT NULL THEN "modifiedAt" ELSE "createdAt" END DESC;
	`

	args := []interface{}{user.Id, folder}

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	threadList := &ThreadList{
		Threads: []*Thread{},
	}

	for rows.Next() {
		var thread Thread

		err := rows.Scan(thread.Scan()...)

		if err != nil {
			return nil, err
		}

		threadList.Threads = append(threadList.Threads, &thread)
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

	err = tx.QueryRowContext(ctx, query, args...).Scan(&threadList.History)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return threadList, nil
}

func (r *ThreadRepository) Trash(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer tx.Rollback()

		query := `
		UPDATE "Message"
			SET "lastStmt" = 2,
			"deviceId" = $1
			WHERE "userId" = $2 AND
			payload->>'$.headers.X-Thread-ID' IN (SELECT value FROM json_each($3, '$.ids'));`

		prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

		args := []interface{}{prefixedDeviceId, user.Id, ids}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}

		query = `
		UPDATE "Draft"
			SET "lastStmt" = 2,
			"deviceId" = $1
			WHERE "userId" = $2 AND
			payload->>'$.headers.X-Thread-ID' IN (SELECT value FROM json_each($3, '$.ids'));`

		args = []interface{}{prefixedDeviceId, user.Id, ids}

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

func (r *ThreadRepository) Untrash(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer tx.Rollback()

		query := `
		UPDATE "Message"
			SET "lastStmt" = 0,
			"deviceId" = $1
			WHERE "userId" = $2 AND
			payload->>'$.headers.X-Thread-ID' IN (SELECT value FROM json_each($3, '$.ids'));`

		prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

		args := []interface{}{prefixedDeviceId, user.Id, ids}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}

		query = `
		UPDATE "Draft"
			SET "lastStmt" = 0,
			"deviceId" = $1
			WHERE "userId" = $2 AND
			payload->>'$.headers.X-Thread-ID' IN (SELECT value FROM json_each($3, '$.ids'));`

		args = []interface{}{prefixedDeviceId, user.Id, ids}

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

func (r ThreadRepository) Delete(user *User, ids string) error {
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
			payload->>'$.headers.X-Thread-ID' IN (SELECT value FROM json_each($2, '$.ids'));`

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

		query = `
		DELETE
			FROM "Draft"
			WHERE "userId" = $1 AND
			payload->>'$.headers.X-Thread-ID' IN (SELECT value FROM json_each($2, '$.ids'));`

		args = []interface{}{user.Id, ids}

		_, err = tx.ExecContext(ctx, query, args...)
		if err != nil {
			return err
		}

		query = `
		UPDATE "DraftDeleted"
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
