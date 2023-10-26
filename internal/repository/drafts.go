package repository

import (
	"cargomail/internal/config"
	"context"
	"database/sql"
	"errors"
	"net/mail"
	"reflect"
	"strings"
	"time"

	"github.com/google/uuid"
)

type UseDraftRepository interface {
	Create(user *User, draft *Draft) (*Draft, error)
	List(user *User) (*DraftList, error)
	Sync(user *User, history *History) (*DraftSync, error)
	Update(user *User, draft *Draft) (*Draft, error)
	Trash(user *User, ids string) error
	Untrash(user *User, ids string) error
	Delete(user *User, ids string) error
	GetById(user *User, id string) (*Draft, error)
	Send(user *User, draft *Draft) (*Message, error)
}

type DraftRepository struct {
	db *sql.DB
}

// type Attachment struct {
// 	Id          string `json:"id"`
// 	Digest      string `json:"digest"`
// 	ContentType string `json:"contentType"`
// 	FileName    string `json:"fileName"`
// 	Size        int64  `json:"size"`
// }

// type Attachments []Attachment

// type AttachmentIds []string

type Draft struct {
	Id      string       `json:"id"`
	UserId  int64        `json:"-"`
	Unread  bool         `json:"unread"`
	Starred bool         `json:"starred"`
	Payload *MessagePart `json:"payload,omitempty"`
	//	Attachments Attachments  `json:"attachments,omitempty"`
	LabelIds   *string    `json:"labelIds"`
	CreatedAt  Timestamp  `json:"createdAt"`
	ModifiedAt *Timestamp `json:"modifiedAt"`
	TimelineId int64      `json:"-"`
	HistoryId  int64      `json:"-"`
	LastStmt   int        `json:"-"`
	DeviceId   *string    `json:"-"`
}

type DraftDeleted struct {
	Id        string  `json:"id"`
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

// func (v Attachments) Value() (driver.Value, error) {
// 	return json.Marshal(v)
// }

// func (v *Attachments) Scan(value interface{}) error {
// 	b, ok := value.([]byte)
// 	if !ok {
// 		return errors.New("type assertion to []byte failed")
// 	}

// 	return json.Unmarshal(b, &v)
// }

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
				 "unread",
				 "payload")
			VALUES ($1,
					$2,
					$3,
					$4)
			RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	unread := false

	args := []interface{}{user.Id,
		prefixedDeviceId,
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

	var deviceId string

	if !history.IgnoreDevice {
		deviceId = *user.DeviceId
	}

	// inserted rows
	query := `
		SELECT *
			FROM "Draft"
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

	args = []interface{}{user.Id, deviceId, history.Id}

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

	args = []interface{}{user.Id, deviceId, history.Id}

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

	args = []interface{}{user.Id, deviceId, history.Id}

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

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `
		UPDATE "Draft"
			SET "payload" = $1,
				"deviceId" = $2
			WHERE "userId" = $3 AND
			      "id" = $4 AND
				  "lastStmt" <> 2
			RETURNING id ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	args := []interface{}{draft.Payload, prefixedDeviceId, user.Id, draft.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(&draft.Id)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrDraftNotFound
		default:
			return nil, err
		}
	}

	query = `
	SELECT *
		FROM "Draft"
		WHERE "userId" = $1 AND
		"id" = $2 AND
		"lastStmt" <> 2;`

	args = []interface{}{user.Id, draft.Id}

	err = tx.QueryRowContext(ctx, query, args...).Scan(draft.Scan()...)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return draft, nil
}

func (r *DraftRepository) Trash(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		query := `
		UPDATE Draft
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

func (r *DraftRepository) Untrash(user *User, ids string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if len(ids) > 0 {
		query := `
		UPDATE "Draft"
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

func (r DraftRepository) Delete(user *User, ids string) error {
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
			FROM "Draft"
			WHERE "userId" = $1 AND
			"id" IN (SELECT value FROM json_each($2, '$.ids'));`

		args := []interface{}{user.Id, ids}

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

func (r DraftRepository) GetById(user *User, id string) (*Draft, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT *
			FROM "Draft"
			WHERE "userId" = $1 AND
				"id" = $2 AND
				"lastStmt" < 2;`

	draft := &Draft{}

	args := []interface{}{user.Id, id}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(draft.Scan()...)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return &Draft{}, ErrDraftNotFound
		}
		return &Draft{}, err
	}

	return draft, nil
}

func validSender(user *User, str string) bool {
	s := strings.SplitAfter(str, "<")
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

func validRecipients(str string) (recipients []string, ok bool) {
	recipients = []string{}

	s := strings.SplitAfter(str, "<")
	for k, v := range s {
		if k > 0 {
			recipient := strings.Split(v, ">")

			address, err := mail.ParseAddress(recipient[0])
			if err != nil {
				return []string{}, false
			}

			recipients = append(recipients, address.Address)
		}
	}

	return recipients, len(s) > 1
}

func (r DraftRepository) Send(user *User, draft *Draft) (*Message, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	t := time.Now()
	draft.Payload.Headers["Date"] = t.Format(time.UnixDate)

	if val, ok := draft.Payload.Headers["From"].(string); ok {
		if len(val) == 0 {
			return nil, ErrMissingSender
		}

		if !validSender(user, val) {
			return nil, ErrInvalidSender
		}
	} else {
		return nil, ErrMissingSender
	}

	var recipients []string

	if val, ok := draft.Payload.Headers["To"].(string); ok {
		if len(val) == 0 {
			return nil, ErrMissingRecipients
		}

		if val, ok := validRecipients(val); ok {
			if ok {
				recipients = append(recipients, val...)
			} else {
				return nil, ErrInvalidRecipients
			}
		}
	} else {
		return nil, ErrMissingRecipients
	}

	if val, ok := draft.Payload.Headers["Cc"].(string); ok {
		if val, ok := validRecipients(val); ok {
			if ok {
				recipients = append(recipients, val...)
			} else {
				return nil, ErrInvalidRecipients
			}
		}
	}

	if val, ok := draft.Payload.Headers["Bcc"].(string); ok {
		if val, ok := validRecipients(val); ok {
			if ok {
				recipients = append(recipients, val...)
			} else {
				return nil, ErrInvalidRecipients
			}
		}
	}

	messageIdValue := "<" + uuid.NewString() + "@" + config.Configuration.DomainName + ">"

	var threadIdValue string

	if val, ok := draft.Payload.Headers["X-Thread-ID"].(string); ok {
		threadIdValue = val
	}

	if len(threadIdValue) == 0 {
		threadIdValue = "<" + uuid.NewString() + "@" + config.Configuration.DomainName + ">"
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
			  "id" = $4 AND
			  "lastStmt" <> 2
		RETURNING * ;`

	prefixedDeviceId := getPrefixedDeviceId(user.DeviceId)

	args := []interface{}{draft.Payload, prefixedDeviceId, user.Id, draft.Id}

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
			 "unread",
			 "folder",
			 "payload")
		VALUES ($1,
				$2,
				$3,
				$4,
				$5)
		RETURNING * ;`

	unread := false
	folder := 1 // sent

	draft.Payload.Headers["Message-ID"] = messageIdValue
	draft.Payload.Headers["X-Thread-ID"] = threadIdValue

	args = []interface{}{user.Id,
		prefixedDeviceId,
		unread,
		folder,
		draft.Payload}

	err = tx.QueryRowContext(ctx, query, args...).Scan(message.Scan()...)
	if err != nil {
		return nil, err
	}

	var blobContentIds []string
	var fileContentIds []string

	// TODO rewrite :--)
	if len(draft.Payload.Parts) > 0 {
		if val, ok := draft.Payload.Headers["Content-Type"].(string); ok {
			if strings.EqualFold(val, "multipart/alternative") {
				for _, part := range draft.Payload.Parts {
					if val, ok := part.Headers["Content-Disposition"].(string); ok {
						if val == "inline" {
							var accessType string
							var hashAlgorithm string
							var contentId string
							if val, ok := part.Headers["Content-ID"].(string); ok {
								s := strings.SplitAfter(val, "<")
								if len(s) > 0 {
									contentId = strings.TrimRight(s[1], ">")
								}
							}
							if val, ok := part.Headers["Content-Type"].([]interface{}); ok {
								if len(val) > 1 {
									if val, ok := val[0].(string); ok {
										s := strings.SplitAfter(val, "access-type=\"")
										if len(s) > 1 {
											accessType = strings.Split(s[1], "\"")[0]
										}
										s = strings.SplitAfter(val, "hash-algorithm=\"")
										if len(s) > 1 {
											hashAlgorithm = strings.Split(s[1], "\"")[0]
										}
									}
								}
							}
							if len(contentId) > 0 && accessType == "x-content-addressed-uri" && hashAlgorithm == "sha256" {
								blobContentIds = append(blobContentIds, contentId)
							}
						}
					}
				}
			}
		}
		for _, part := range draft.Payload.Parts {
			if val, ok := part.Headers["Content-Type"].(string); ok {
				if strings.EqualFold(val, "multipart/alternative") {
					if len(part.Parts) > 0 {
						for _, part := range part.Parts {
							if val, ok := part.Headers["Content-Disposition"].(string); ok {
								if val == "inline" {
									var accessType string
									var hashAlgorithm string
									var contentId string
									if val, ok := part.Headers["Content-ID"].(string); ok {
										s := strings.SplitAfter(val, "<")
										if len(s) > 0 {
											contentId = strings.TrimRight(s[1], ">")
										}
									}
									if val, ok := part.Headers["Content-Type"].([]interface{}); ok {
										if len(val) > 1 {
											if val, ok := val[0].(string); ok {
												s := strings.SplitAfter(val, "access-type=\"")
												if len(s) > 1 {
													accessType = strings.Split(s[1], "\"")[0]
												}
												s = strings.SplitAfter(val, "hash-algorithm=\"")
												if len(s) > 1 {
													hashAlgorithm = strings.Split(s[1], "\"")[0]
												}
											}
										}
									}
									if len(contentId) > 0 && accessType == "x-content-addressed-uri" && hashAlgorithm == "sha256" {
										blobContentIds = append(blobContentIds, contentId)
									}
								}
							}
						}
					}
				} else if strings.EqualFold(val, "multipart/mixed") {
					if len(part.Parts) > 0 {
						for _, part := range part.Parts {
							if val, ok := part.Headers["Content-Disposition"].(string); ok {
								if strings.HasPrefix(val, "attachment;") {
									var accessType string
									var hashAlgorithm string
									var contentId string
									if val, ok := part.Headers["Content-ID"].(string); ok {
										s := strings.SplitAfter(val, "<")
										if len(s) > 0 {
											contentId = strings.TrimRight(s[1], ">")
										}
									}
									if val, ok := part.Headers["Content-Type"].([]interface{}); ok {
										if len(val) > 1 {
											if val, ok := val[0].(string); ok {
												s := strings.SplitAfter(val, "access-type=\"")
												if len(s) > 1 {
													accessType = strings.Split(s[1], "\"")[0]
												}
												s = strings.SplitAfter(val, "hash-algorithm=\"")
												if len(s) > 1 {
													hashAlgorithm = strings.Split(s[1], "\"")[0]
												}
											}
										}
									}
									if len(contentId) > 0 && accessType == "x-content-addressed-uri" && hashAlgorithm == "sha256" {
										fileContentIds = append(fileContentIds, contentId)
									}
								}
							}
						}
					}
				}
			}
		}
	}

	var recipientsNotFound []string

	// simple send
	for _, recipient := range recipients {
		query = `
		INSERT
			INTO "Message" ("userId",
				 "deviceId",
				 "unread",
				 "folder",
				 "payload")
			VALUES ((SELECT "id" FROM "User" WHERE "username" = $1),
					NULL,
					$2,
					$3,
					$4)
			RETURNING * ;`

		var username string
		emailAddress := strings.Split(recipient, "@")
		if strings.EqualFold(emailAddress[1], config.Configuration.DomainName) {
			username = emailAddress[0]
		}
		unread := true
		folder := 2 // inbox

		draft.Payload.Headers["Message-ID"] = messageIdValue
		draft.Payload.Headers["X-Thread-ID"] = threadIdValue

		args = []interface{}{username,
			unread,
			folder,
			draft.Payload}

		err = tx.QueryRowContext(ctx, query, args...).Scan(message.Scan()...)
		if err != nil {
			switch {
			case err.Error() == `NOT NULL constraint failed: Message.userId`:
				// return nil, ErrRecipientNotFound
				// ignore error
				recipientsNotFound = append(recipientsNotFound, recipient)
			default:
				return nil, err
			}
		}

		// access to blobs
		for _, contentId := range blobContentIds {
			folder := 2 // inbox

			query := `
					INSERT INTO
						"Blob" ("userId", "deviceId", "folder", "digest", "name", "path", "contentType", "size", "metadata")
						 SELECT (SELECT "id" FROM "User" WHERE "username" = $1), NULL, $2, "digest", "name", "path", "contentType", "size", "metadata"
							FROM "Blob"
							WHERE "userId" = $3 AND
								  "digest" = $4 AND
								  "lastStmt" < 2
								  LIMIT 1;`

			args := []interface{}{username, folder, user.Id, contentId}

			_, err := tx.ExecContext(ctx, query, args...)
			if err != nil {
				return nil, err
			}

		}

		

		// access to files
		for _, contentId := range fileContentIds {
			folder := 2 // inbox

			query := `
			INSERT INTO
				"File" ("userId", "deviceId", "folder", "digest", "name", "path", "contentType", "size", "metadata")
				 SELECT (SELECT "id" FROM "User" WHERE "username" = $1), NULL, $2, "digest", "name", "path", "contentType", "size", "metadata"
					FROM "File"
					WHERE "userId" = $3 AND
						  "digest" = $4 AND
						  "lastStmt" < 2
						  LIMIT 1;`

			args := []interface{}{username, folder, user.Id, contentId}

			_, err := tx.ExecContext(ctx, query, args...)
			if err != nil {
				return nil, err
			}

		}
	}

	query = `
	UPDATE "Blob"
		SET "draftId" = NULL,
		    "folder" = 1
		WHERE "userId" = $1 AND
		"draftId" = $2;`

	args = []interface{}{user.Id, draft.Id}

	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	query = `
	DELETE
		FROM "Draft"
		WHERE "userId" = $1 AND
		"id" = $2;`

	args = []interface{}{user.Id, draft.Id}

	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	query = `
	UPDATE "DraftDeleted"
		SET "deviceId" = $1
		WHERE "userId" = $2 AND
		"id" = $3;`

	args = []interface{}{user.DeviceId, user.Id, draft.Id}

	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return message, err
	}

	if len(recipientsNotFound) > 0 {
		return message, &RecipientsNotFoundError{
			Recipients: recipientsNotFound,
			Err:        ErrRecipientNotFound,
		}
	}

	message.Folder = 1 // sent

	return message, nil
}
