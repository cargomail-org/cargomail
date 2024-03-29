package database

import (
	_ "embed"

	"context"
	"database/sql"
	"log"
	"time"
)

var (
	//go:embed schema/tables.sql
	tables string
	//go:embed schema/user_triggers.sql
	userTriggers string
	//go:embed schema/blob_triggers.sql
	blobTriggers string
	//go:embed schema/file_triggers.sql
	fileTriggers string
	//go:embed schema/draft_triggers.sql
	draftTriggers string
	//go:embed schema/message_triggers.sql
	messageTriggers string
	//go:embed schema/label_triggers.sql
	labelTriggers string
	//go:embed schema/contact_triggers.sql
	contactTriggers string
)

func Init(db *sql.DB) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ExecContext(ctx, tables)
	if err != nil {
		log.Fatal("sql tables: ", err)
	}

	_, err = db.ExecContext(ctx, userTriggers)
	if err != nil {
		log.Fatal("sql user triggers: ", err)
	}

	_, err = db.ExecContext(ctx, blobTriggers)
	if err != nil {
		log.Fatal("sql blob triggers: ", err)
	}

	_, err = db.ExecContext(ctx, fileTriggers)
	if err != nil {
		log.Fatal("sql file triggers: ", err)
	}

	_, err = db.ExecContext(ctx, draftTriggers)
	if err != nil {
		log.Fatal("sql draft triggers: ", err)
	}

	_, err = db.ExecContext(ctx, messageTriggers)
	if err != nil {
		log.Fatal("sql message triggers: ", err)
	}

	_, err = db.ExecContext(ctx, labelTriggers)
	if err != nil {
		log.Fatal("sql label triggers: ", err)
	}

	_, err = db.ExecContext(ctx, contactTriggers)
	if err != nil {
		log.Fatal("sql contact triggers: ", err)
	}
}
