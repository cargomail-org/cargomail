package repository

import (
	"context"
	"database/sql"
	"strconv"

	emailv1 "github.com/federizer/cargomail/generated/proto/email/v1"
	"github.com/federizer/cargomail/internal/mail"
	"google.golang.org/grpc/metadata"
)

type Repo interface {
	LabelsList(context.Context) ([]*emailv1.Label, error)
	ThreadsList(context.Context) ([]*emailv1.Thread, error)
	ThreadsGet(context.Context, int64) (*emailv1.Thread, error)
	MessagesModify(context.Context, int64, []string, []string) (*emailv1.Message, error)
	DraftsList(context.Context) ([]*emailv1.Draft, error)
	DraftsGet(context.Context, int64) (*emailv1.Draft, error)
	DraftsCreate(context.Context, *emailv1.Draft) (*emailv1.Draft, error)
	DraftsUpdate(context.Context, int64, *emailv1.Message) (*emailv1.Draft, error)
	DraftsDelete(context.Context, int64) int64
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db}
}

func getUsername(ctx context.Context) string {
	md, ok := metadata.FromIncomingContext(ctx)
	if ok && len(md["username"]) > 0 {
		return md["username"][0]
	}
	return ""
}

func (r *Repository) LabelsList(ctx context.Context) ([]*emailv1.Label, error) {
	var labels []*emailv1.Label

	sqlStatement := `SELECT fedemail.labels_list_v1($1);`
	rows, err := r.db.Query(sqlStatement, getUsername(ctx))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var scanLabel ScanLabel
		err = rows.Scan(&scanLabel)
		if err != nil {
			return nil, err
		}
		labels = append(labels, scanLabel.Label)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return labels, nil
}

func (r *Repository) ThreadsList(ctx context.Context) ([]*emailv1.Thread, error) {
	var threads []*emailv1.Thread

	sqlStatement := `SELECT * FROM fedemail.threads_list_v1($1);`
	rows, err := r.db.Query(sqlStatement, getUsername(ctx))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var scanThread ScanThread
		err = rows.Scan(&scanThread)
		if err != nil {
			return nil, err
		}
		threads = append(threads, scanThread.Thread)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return threads, nil
}

func (r *Repository) ThreadsGet(ctx context.Context, threadId int64) (*emailv1.Thread, error) {
	var thread emailv1.Thread

	sqlStatement := `SELECT fedemail.threads_get_v1($1, $2);`
	rows, err := r.db.Query(sqlStatement, getUsername(ctx), threadId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var scanMessage ScanMessage
		err = rows.Scan(&scanMessage)
		if err != nil {
			return nil, err
		}
		thread.Messages = append(thread.Messages, scanMessage.Message)

		if len(thread.Id) == 0 {
			thread.Id = scanMessage.GetThreadId()
			thread.HistoryId = scanMessage.GetHistoryId()
			// thread.Snippet = scanMessage.GetSnippet()
		}
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return &thread, nil
}

func (r *Repository) MessagesModify(ctx context.Context, messageId int64, addLabelIds, removeLabelIds []string) (*emailv1.Message, error) {
	var message emailv1.Message
	message.Id = strconv.FormatInt(messageId, 10)
	message.ThreadId = "24"
	message.LabelIds = append(message.LabelIds, "CATEGORY_SOCIAL")
	// message.LabelIds = append(message.LabelIds, "INBOX")

	return &message, nil
}

func (r *Repository) DraftsList(ctx context.Context) ([]*emailv1.Draft, error) {
	var drafts []*emailv1.Draft

	sqlStatement := `SELECT fedemail.drafts_list_v1($1);`
	rows, err := r.db.Query(sqlStatement, getUsername(ctx))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var scanDraft ScanDraft
		err = rows.Scan(&scanDraft)
		if err != nil {
			return nil, err
		}
		drafts = append(drafts, scanDraft.Draft)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return drafts, nil
}

func (r *Repository) DraftsGet(ctx context.Context, id int64) (*emailv1.Draft, error) {
	var scanDraft ScanDraft

	sqlStatement := `SELECT fedemail.drafts_get_v1($1, $2);`
	err := r.db.QueryRow(sqlStatement, getUsername(ctx), id).Scan(&scanDraft)
	if err != nil {
		return nil, err
	}

	return scanDraft.Draft, err
}

func (r *Repository) DraftsCreate(ctx context.Context, draft *emailv1.Draft) (*emailv1.Draft, error) {
	var scanDraft ScanDraft
	scanDraft.Draft = draft

	sqlStatement := `SELECT fedemail.drafts_create_v1($1, $2);`
	err := r.db.QueryRow(sqlStatement, getUsername(ctx), scanDraft).Scan(&scanDraft)
	if err != nil {
		return nil, err
	}

	return scanDraft.Draft, err
}

func (r *Repository) DraftsUpdate(ctx context.Context, id int64, message *emailv1.Message) (*emailv1.Draft, error) {
	var scanDraft ScanDraft
	var scanMessage ScanMessage
	var mailMessage mail.MailMessage

	mailMessage.Message = message
	message, err := mailMessage.GetParsedMessage()
	if err != nil {
		return nil, err
	}

	scanMessage.Message = message

	sqlStatement := `SELECT fedemail.drafts_update_v1($1, $2, $3);`
	err = r.db.QueryRow(sqlStatement, getUsername(ctx), id, scanMessage).Scan(&scanDraft)
	if err != nil {
		return nil, err
	}

	return scanDraft.Draft, err
}

func (r *Repository) DraftsDelete(ctx context.Context, id int64) int64 {
	var cnt int64

	sqlStatement := `SELECT fedemail.drafts_delete_v1($1, $2);`
	err := r.db.QueryRow(sqlStatement, getUsername(ctx), id).Scan(&cnt)
	if err != nil {
		return 0
	}

	return cnt
}