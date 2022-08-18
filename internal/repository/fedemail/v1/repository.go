package repository

import (
	"database/sql"
	"strconv"

	"github.com/federizer/fedemail/gen/proto/fedemail/v1"
)

type Repo interface {
	LabelsList() ([]*fedemailv1.Label, error)
	ThreadsList() ([]*fedemailv1.Thread, error)
	ThreadsGet(int64) (*fedemailv1.Thread, error)
	MessagesModify(int64, []string, []string) (*fedemailv1.Message, error)
	DraftsCreate(*fedemailv1.Draft) (*fedemailv1.Draft, error)
	DraftsUpdate(int64, *fedemailv1.Draft) (*fedemailv1.Draft, error)
	DraftsDelete(int64) int64
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db}
}

func (r *Repository) LabelsList() ([]*fedemailv1.Label, error) {
	var labels []*fedemailv1.Label

	sqlStatement := `SELECT fedemail.labels_list_v1($1);`
	rows, err := r.db.Query(sqlStatement, "matthew.cuthbert@demo.localhost")
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

func (r *Repository) ThreadsList() ([]*fedemailv1.Thread, error) {
	var threads []*fedemailv1.Thread

	sqlStatement := `SELECT fedemail.threads_list_v1($1);`
	rows, err := r.db.Query(sqlStatement, "matthew.cuthbert@demo.localhost")
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

func (r *Repository) ThreadsGet(threadId int64) (*fedemailv1.Thread, error) {
	var thread fedemailv1.Thread

	sqlStatement := `SELECT fedemail.threads_get_v1($1, $2);`
	rows, err := r.db.Query(sqlStatement, "matthew.cuthbert@demo.localhost", threadId)
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

func (r *Repository) MessagesModify(messageId int64, addLabelIds, removeLabelIds []string) (*fedemailv1.Message, error) {
	var message fedemailv1.Message
	message.Id = strconv.FormatInt(messageId, 10)
	message.ThreadId = "24"
	message.LabelIds = append(message.LabelIds, "CATEGORY_SOCIAL")
	// message.LabelIds = append(message.LabelIds, "INBOX")

	return &message, nil
}

func (r *Repository) DraftsCreate(draft *fedemailv1.Draft) (*fedemailv1.Draft, error) {
	var message fedemailv1.Message
	message.Id = strconv.FormatInt(200, 10)
	message.ThreadId = "300"
	message.LabelIds = append(message.LabelIds, "DRAFT")

	draft.Id = "4"
	draft.Message = &message

	return draft, nil
}

func (r *Repository) DraftsUpdate(messageId int64, draft *fedemailv1.Draft) (*fedemailv1.Draft, error) {
	// var message fedemailv1.Message
	// message.Id = strconv.FormatInt(200, 10)
	// message.ThreadId = "300"
	// message.LabelIds = append(message.LabelIds, "DRAFT")

	// draft.Id = "4"
	// draft.Message = &message

	return draft, nil
}

func (r *Repository) DraftsDelete(id int64) int64 {
	var cnt int64

	sqlStatement := `SELECT fedemail.drafts_delete_v1($1, $2);`
	err := r.db.QueryRow(sqlStatement, "matthew.cuthbert@demo.localhost", id).Scan(&cnt)
	if err != nil {
		return 0
	}

	return cnt
}
