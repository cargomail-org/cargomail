PRAGMA foreign_keys=ON;

------------------------------tables-----------------------------

CREATE TABLE IF NOT EXISTS user (
    id				INTEGER PRIMARY KEY,
    username		TEXT NOT NULL UNIQUE,
    password_hash	TEXT NOT NULL,
    firstname		TEXT DEFAULT "",
    lastname		TEXT DEFAULT "",
    created_at		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session (
    hash 			BLOB PRIMARY KEY,
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    expiry 			TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    scope 			TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS file (
    id				VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    uri 	    	VARCHAR(32) NOT NULL,
    name			TEXT NOT NULL,
    path			TEXT NOT NULL,
    size			INTEGER NOT NULL,
    content_type	TEXT NOT NULL,
    created_at		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at		TIMESTAMP,
    timeline_id		INTEGER(8) NOT NULL DEFAULT 0,
    history_id 		INTEGER(8) NOT NULL DEFAULT 0,
    last_stmt  		INTEGER(2) NOT NULL DEFAULT 0, -- 0-inserted, 1-updated, 2-trashed
    device_id       VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS message
(
    id              VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
    user_id 	    INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    message_uid     VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))),
    parent_uid      VARCHAR(32),
    thread_uid      VARCHAR(32) NOT NULL,
    forwarded       BOOLEAN NOT NULL DEFAULT FALSE,
    unread          BOOLEAN NOT NULL DEFAULT TRUE, 
    starred         BOOLEAN NOT NULL DEFAULT FALSE, 
    folder          INTEGER(2) NOT NULL,             -- 0-draft, 1-sent, 2-inbox, 3-spam
    user_label_ids  TEXT,                            -- json array of user label ids
    shared_label_ids TEXT,                           -- json array of shared label ids
    "from"          TEXT NOT NULL,                   -- json array of recipients
    "to"            TEXT,                            -- json array of recipients
    "cc"            TEXT,                            -- json array of recipients
    "bcc"           TEXT,                            -- json array of recipients
    "group"         TEXT,                            -- json array of recipients
    origin_url      VARCHAR(255),                    -- Origin-Resource-Mailbox-URL e.g. mailbox.hospital.com
    desination_url  VARCHAR(255),                    -- Destination-Resource-Mailbox-URL e.g. mailbox.insurance.com
    tags            TEXT,                            -- json array of key/value e.g. [{correspondence_category: healthcare}]
    cargoes         TEXT,                            -- json array of mimetype, uri, size
    subject         VARCHAR(255),
    snippet         VARCHAR(255),
    body_mimetype   VARCHAR(255),
    body_uri        VARCHAR(32),
    body_size       INTEGER(8),
    sent_at         TIMESTAMP,
    received_at     TIMESTAMP,
    snoozed_at      TIMESTAMP,
    created_at		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at		TIMESTAMP,
    timeline_id     INTEGER(8) NOT NULL DEFAULT 0,
    history_id      INTEGER(8) NOT NULL DEFAULT 0,
    last_stmt       INTEGER(2) NOT NULL DEFAULT 0, -- 0-inserted, 1-updated, 2-trashed
    device_id       VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS label (
    id				VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    created_at		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at		TIMESTAMP,
    timeline_id		INTEGER(8) NOT NULL DEFAULT 0,
    history_id 		INTEGER(8) NOT NULL DEFAULT 0,
    last_stmt  		INTEGER(2) NOT NULL DEFAULT 0, -- 0-inserted, 1-updated, 2-trashed
    device_id       VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS contact (
    id				VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    email_address   VARCHAR(255),
    firstname		VARCHAR(255),
    lastname		VARCHAR(255),
    created_at		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at		TIMESTAMP,
    timeline_id		INTEGER(8) NOT NULL DEFAULT 0,
    history_id 		INTEGER(8) NOT NULL DEFAULT 0,
    last_stmt  		INTEGER(2) NOT NULL DEFAULT 0, -- 0-inserted, 1-updated, 2-trashed
    device_id       VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS file_deleted (
    id				VARCHAR(32) NOT NULL PRIMARY KEY,
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    history_id 		INTEGER(8) NOT NULL DEFAULT 0,
    device_id       VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS message_deleted (
    id				VARCHAR(32) NOT NULL PRIMARY KEY,
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    history_id 		INTEGER(8) NOT NULL DEFAULT 0,
    device_id       VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS label_deleted (
    id				VARCHAR(32) NOT NULL PRIMARY KEY,
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    history_id 		INTEGER(8) NOT NULL DEFAULT 0,
    device_id       VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS contact_deleted (
    id				VARCHAR(32) NOT NULL PRIMARY KEY,
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    history_id 		INTEGER(8) NOT NULL DEFAULT 0,
    device_id       VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS file_timeline_seq (
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    last_timeline_id INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS file_history_seq (
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    last_history_id INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS message_timeline_seq (
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    last_timeline_id INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS message_history_seq (
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    last_history_id INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS label_timeline_seq (
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    last_timeline_id INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS label_history_seq (
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    last_history_id INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_timeline_seq (
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    last_timeline_id INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_history_seq (
    user_id 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    last_history_id INTEGER(8) NOT NULL
);

------------------------------indexes----------------------------

CREATE INDEX IF NOT EXISTS idx_file_uri ON file(uri);
CREATE INDEX IF NOT EXISTS idx_file_timeline_id ON file (timeline_id);
CREATE INDEX IF NOT EXISTS idx_file_history_id ON file (history_id);
CREATE INDEX IF NOT EXISTS idx_file_last_stmt ON file (last_stmt);

CREATE INDEX IF NOT EXISTS idx_message_timeline_id ON message (timeline_id);
CREATE INDEX IF NOT EXISTS idx_message_history_id ON message (history_id);
CREATE INDEX IF NOT EXISTS idx_message_last_stmt ON message (last_stmt);

CREATE UNIQUE INDEX IF NOT EXISTS idx_label_name ON label(name);
CREATE INDEX IF NOT EXISTS idx_label_timeline_id ON label (timeline_id);
CREATE INDEX IF NOT EXISTS idx_label_history_id ON label (history_id);
CREATE INDEX IF NOT EXISTS idx_label_last_stmt ON label (last_stmt);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact ON contact(email_address, firstname, lastname);
CREATE INDEX IF NOT EXISTS idx_contact_timeline_id ON contact (timeline_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_id ON contact (history_id);
CREATE INDEX IF NOT EXISTS idx_contact_last_stmt ON contact (last_stmt);

CREATE UNIQUE INDEX IF NOT EXISTS idx_file_timeline_seq ON file_timeline_seq(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_history_seq ON file_history_seq(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_timeline_seq ON message_timeline_seq(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_history_seq ON message_history_seq(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_label_timeline_seq ON label_timeline_seq(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_label_history_seq ON label_history_seq(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_timeline_seq ON contact_timeline_seq(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_history_seq ON contact_history_seq(user_id);

