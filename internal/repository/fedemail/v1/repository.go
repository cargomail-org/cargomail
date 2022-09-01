package repository

import (
	"context"
	"database/sql"
	"math/rand"
	"strconv"
	"time"

	"github.com/federizer/fedemail/generated/proto/fedemail/v1"
	"google.golang.org/grpc/metadata"
)

type Repo interface {
	LabelsList(context.Context) ([]*fedemailv1.Label, error)
	ThreadsList(context.Context) ([]*fedemailv1.Thread, error)
	ThreadsGet(context.Context, int64) (*fedemailv1.Thread, error)
	MessagesModify(context.Context, int64, []string, []string) (*fedemailv1.Message, error)
	DraftsCreate(context.Context, *fedemailv1.Draft) (*fedemailv1.Draft, error)
	DraftsUpdate(context.Context, int64, *fedemailv1.Draft) (*fedemailv1.Draft, error)
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

func (r *Repository) LabelsList(ctx context.Context) ([]*fedemailv1.Label, error) {
	var labels []*fedemailv1.Label

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

func (r *Repository) ThreadsList(ctx context.Context) ([]*fedemailv1.Thread, error) {
	var threads []*fedemailv1.Thread

	sqlStatement := `SELECT fedemail.threads_list_v1($1);`
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

func (r *Repository) ThreadsGet(ctx context.Context, threadId int64) (*fedemailv1.Thread, error) {
	var thread fedemailv1.Thread

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
			thread.TimelineId = scanMessage.GetTimelineId()
			// thread.Snippet = scanMessage.GetSnippet()
		}
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return &thread, nil
}

func (r *Repository) MessagesModify(ctx context.Context, messageId int64, addLabelIds, removeLabelIds []string) (*fedemailv1.Message, error) {
	var message fedemailv1.Message
	message.Id = strconv.FormatInt(messageId, 10)
	message.ThreadId = "24"
	message.LabelIds = append(message.LabelIds, "CATEGORY_SOCIAL")
	// message.LabelIds = append(message.LabelIds, "INBOX")

	return &message, nil
}

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func init() {
	rand.Seed(time.Now().UnixNano())
}

func randSeq(n int) string {
    b := make([]rune, n)
    for i := range b {
        b[i] = letters[rand.Intn(len(letters))]
    }
    return string(b)
}

func (r *Repository) DraftsCreate(ctx context.Context, draft *fedemailv1.Draft) (*fedemailv1.Draft, error) {
	var message fedemailv1.Message
	message.Id = strconv.FormatInt(200, 10)
	message.ThreadId = "300"
	message.LabelIds = append(message.LabelIds, "DRAFT")

	draft.Id = randSeq(10)
	draft.Message = &message

	return draft, nil
}

func (r *Repository) DraftsUpdate(ctx context.Context, messageId int64, draft *fedemailv1.Draft) (*fedemailv1.Draft, error) {
	// var message fedemailv1.Message
	// message.Id = strconv.FormatInt(200, 10)
	// message.ThreadId = "300"
	// message.LabelIds = append(message.LabelIds, "DRAFT")

	// draft.Id = "4"
	// draft.Message = &message

	return draft, nil
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
