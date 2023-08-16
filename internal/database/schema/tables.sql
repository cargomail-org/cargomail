PRAGMA foreign_keys=ON;

------------------------------tables-----------------------------

CREATE TABLE IF NOT EXISTS "User" (
    "id"			INTEGER PRIMARY KEY,
    "username"		TEXT NOT NULL UNIQUE,
    "passwordHash"	TEXT NOT NULL,
    "firstName"		TEXT DEFAULT "",
    "lastName"		TEXT DEFAULT "",
    "createdAt"		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Session" (
    "hash" 			BLOB PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "expiry" 		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope" 		TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Body" (
    "id"			VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "uri" 	    	VARCHAR(32) NOT NULL,
    "name"          VARCHAR(255),
    "snippet"       VARCHAR(255),
    "path"			TEXT NOT NULL,
    "size"			INTEGER NOT NULL,
    "contentType"	TEXT NOT NULL,
    "createdAt"		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt"	TIMESTAMP,
    "timelineId"	INTEGER(8) NOT NULL DEFAULT 0,
    "historyId" 	INTEGER(8) NOT NULL DEFAULT 0,
    "lastStmt"  	INTEGER(2) NOT NULL DEFAULT 0, -- 0-inserted, 1-updated, 2-trashed
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "File" (
    "id"			VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "uri" 	    	VARCHAR(32) NOT NULL,
    "name"			TEXT NOT NULL,
    "path"			TEXT NOT NULL,
    "size"			INTEGER NOT NULL,
    "contentType"	TEXT NOT NULL,
    "createdAt"		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt"	TIMESTAMP,
    "timelineId"	INTEGER(8) NOT NULL DEFAULT 0,
    "historyId" 	INTEGER(8) NOT NULL DEFAULT 0,
    "lastStmt"  	INTEGER(2) NOT NULL DEFAULT 0, -- 0-inserted, 1-updated, 2-trashed
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "Draft"
(
    "id"            VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
    "userId" 	    INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "messageUid"    VARCHAR(32) NOT NULL,
    "parentUid"     VARCHAR(32),
    "threadUid"     VARCHAR(32) NOT NULL,
    "unread"        BOOLEAN NOT NULL DEFAULT TRUE, 
    "starred"       BOOLEAN NOT NULL DEFAULT FALSE,
    "payload"       TEXT,                 -- json 'MessagePart' object
    "labelIds"      TEXT,                 -- json 'labelIds' array
    "createdAt"		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt"    TIMESTAMP,
    "timelineId"    INTEGER(8) NOT NULL DEFAULT 0,
    "historyId"     INTEGER(8) NOT NULL DEFAULT 0,
    "lastStmt"      INTEGER(2) NOT NULL DEFAULT 0, -- 0-inserted, 1-updated, 2-trashed
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "Message"
(
    "id"            VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
    "userId" 	    INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "messageUid"    VARCHAR(32) NOT NULL,
    "parentUid"     VARCHAR(32),
    "threadUid"     VARCHAR(32) NOT NULL,
    "unread"        BOOLEAN NOT NULL DEFAULT TRUE, 
    "starred"       BOOLEAN NOT NULL DEFAULT FALSE,
    "folder"        INTEGER(2) NOT NULL,  -- (0 reserverd) 1-sent, 2-inbox, 3-spam
    "payload"       TEXT,                 -- json 'MessagePart' object
    "labelIds"      TEXT,                 -- json 'labelIds' array
    "sentAt"        TIMESTAMP,
    "receivedAt"    TIMESTAMP,
    "snoozedAt"     TIMESTAMP,
    "createdAt"		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt"    TIMESTAMP,
    "timelineId"    INTEGER(8) NOT NULL DEFAULT 0,
    "historyId"     INTEGER(8) NOT NULL DEFAULT 0,
    "lastStmt"      INTEGER(2) NOT NULL DEFAULT 0, -- 0-inserted, 1-updated, 2-trashed
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "Label" (
    "id"			VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES user ON DELETE CASCADE,
    "name"          VARCHAR(255) NOT NULL,
    "createdAt"		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt"	TIMESTAMP,
    "timelineId"	INTEGER(8) NOT NULL DEFAULT 0,
    "historyId" 	INTEGER(8) NOT NULL DEFAULT 0,
    "lastStmt"  	INTEGER(2) NOT NULL DEFAULT 0, -- 0-inserted, 1-updated, 2-trashed
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "Contact" (
    "id"			VARCHAR(32) NOT NULL DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "emailAddress"  VARCHAR(255),
    "firstName"		VARCHAR(255),
    "lastName"		VARCHAR(255),
    "createdAt"		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt"	TIMESTAMP,
    "timelineId"	INTEGER(8) NOT NULL DEFAULT 0,
    "historyId" 	INTEGER(8) NOT NULL DEFAULT 0,
    "lastStmt"  	INTEGER(2) NOT NULL DEFAULT 0, -- 0-inserted, 1-updated, 2-trashed
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "BodyDeleted" (
    "id"			VARCHAR(32) NOT NULL PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "historyId" 	INTEGER(8) NOT NULL DEFAULT 0,
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "FileDeleted" (
    "id"			VARCHAR(32) NOT NULL PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "historyId" 	INTEGER(8) NOT NULL DEFAULT 0,
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "DraftDeleted" (
    "id"			VARCHAR(32) NOT NULL PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "historyId" 	INTEGER(8) NOT NULL DEFAULT 0,
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "MessageDeleted" (
    "id"			VARCHAR(32) NOT NULL PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "historyId" 	INTEGER(8) NOT NULL DEFAULT 0,
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "LabelDeleted" (
    "id"			VARCHAR(32) NOT NULL PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "historyId" 	INTEGER(8) NOT NULL DEFAULT 0,
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "ContactDeleted" (
    "id"			VARCHAR(32) NOT NULL PRIMARY KEY,
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "historyId" 	INTEGER(8) NOT NULL DEFAULT 0,
    "deviceId"      VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS "BodyTimelineSeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastTimelineId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "BodyHistorySeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastHistoryId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "FileTimelineSeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastTimelineId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "FileHistorySeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastHistoryId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "DraftTimelineSeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastTimelineId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "DraftHistorySeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastHistoryId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "MessageTimelineSeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastTimelineId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "MessageHistorySeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastHistoryId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "LabelTimelineSeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastTimelineId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "LabelHistorySeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastHistoryId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "ContactTimelineSeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastTimelineId" INTEGER(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS "ContactHistorySeq" (
    "userId" 		INTEGER NOT NULL REFERENCES "User" ON DELETE CASCADE,
    "lastHistoryId" INTEGER(8) NOT NULL
);

------------------------------indexes----------------------------

CREATE INDEX IF NOT EXISTS "IdxBodyUri" ON "Body" ("uri");
CREATE INDEX IF NOT EXISTS "IdxBodyTimelineId" ON "Body" ("timelineId");
CREATE INDEX IF NOT EXISTS "IdxBodyHistoryId" ON "Body" ("historyId");
CREATE INDEX IF NOT EXISTS "IdxBodyLastStmt" ON "Body" ("lastStmt");

CREATE INDEX IF NOT EXISTS "IdxFileUri" ON "File" ("uri");
CREATE INDEX IF NOT EXISTS "IdxFileTimelineId" ON "File" ("timelineId");
CREATE INDEX IF NOT EXISTS "IdxFileHistoryId" ON "File" ("historyId");
CREATE INDEX IF NOT EXISTS "IdxFileLastStmt" ON "File" ("lastStmt");

CREATE INDEX IF NOT EXISTS "IdxDraftTimelineId" ON "Draft" ("timelineId");
CREATE INDEX IF NOT EXISTS "IdxDraftHistoryId" ON "Draft" ("historyId");
CREATE INDEX IF NOT EXISTS "IdxDraftLastStmt" ON "Draft" ("lastStmt");

CREATE INDEX IF NOT EXISTS "IdxMessageTimelineId" ON "Message" ("timelineId");
CREATE INDEX IF NOT EXISTS "IdxMessageHistoryId" ON "Message" ("historyId");
CREATE INDEX IF NOT EXISTS "IdxMessageLastStmt" ON "Message" ("lastStmt");

CREATE UNIQUE INDEX IF NOT EXISTS "IdxLabelName" ON "Label" ("name");
CREATE INDEX IF NOT EXISTS "IdxLabelTimelineId" ON "Label" ("timelineId");
CREATE INDEX IF NOT EXISTS "IdxLabelHistoryId" ON "Label" ("historyId");
CREATE INDEX IF NOT EXISTS "IdxLabelLastStmt" ON "Label" ("lastStmt");

CREATE UNIQUE INDEX IF NOT EXISTS "IdxContact" ON "Contact"("emailAddress", "firstName", "lastName") WHERE "lastStmt" < 2;
CREATE INDEX IF NOT EXISTS "IdxContactTimelineId" ON "Contact" ("timelineId");
CREATE INDEX IF NOT EXISTS "IdxContactHistoryId" ON "Contact" ("historyId");
CREATE INDEX IF NOT EXISTS "IdxContactLastStmt" ON "Contact" ("lastStmt");

CREATE UNIQUE INDEX IF NOT EXISTS "IdxBodyTimelineSeq" ON "BodyTimelineSeq" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "IdxBodyHistorySeq" ON "BodyHistorySeq" ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "IdxFileTimelineSeq" ON "FileTimelineSeq" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "IdxFileHistorySeq" ON "FileHistorySeq" ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "IdxDraftTimelineSeq" ON "DraftTimelineSeq" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "IdxDraftHistorySeq" ON "DraftHistorySeq" ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "IdxMessageTimelineSeq" ON "MessageTimelineSeq" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "IdxMessageHistorySeq" ON "MessageHistorySeq" ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "IdxLabelTimelineSeq" ON "LabelTimelineSeq" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "idxLabelHistorySeq" ON "LabelHistorySeq" ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "IdxContactTimelineSeq" ON "ContactTimelineSeq" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "IdxContactHistorySeq" ON "ContactHistorySeq" ("userId");