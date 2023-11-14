CREATE TRIGGER IF NOT EXISTS "MessageAfterInsert"
    AFTER INSERT
    ON "Message"
    FOR EACH ROW
BEGIN
    UPDATE "MessageTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = new."userId";
    UPDATE "MessageHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = new."userId";
    UPDATE "Message"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "MessageTimelineSeq" WHERE "userId" = new."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "MessageHistorySeq" WHERE "userId" = new."userId"),
        "lastStmt"   = 0
    WHERE "id" = new."id";
END;

CREATE TRIGGER IF NOT EXISTS "MessageBeforeUpdate"
    BEFORE UPDATE OF
    "id",
    "userId",
    -- "unread", 
    -- "starred", 
    "folder",
    "payload",
    -- "labelIds",
    "sentAt",
    "receivedAt"
    -- "snoozedAt"
    ON "Message"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update not allowed');
END;

CREATE TRIGGER IF NOT EXISTS "MessageAfterUpdate"
    AFTER UPDATE OF
    "unread", 
    "starred"
    ON "Message"
    FOR EACH ROW
BEGIN
    UPDATE "MessageTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = old."userId";
    UPDATE "MessageHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Message"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "MessageTimelineSeq" WHERE "userId" = old."userId"), -- ???
        "historyId"  = (SELECT "lastHistoryId" FROM "MessageHistorySeq" WHERE "userId" = old."userId"),
        "lastStmt"   = 1,
        "modifiedAt" = CURRENT_TIMESTAMP
    WHERE "id" = old."id";
END;

-- Trashed
CREATE TRIGGER IF NOT EXISTS "MessageBeforeTrash"
    BEFORE UPDATE OF
        "lastStmt"
    ON "Message"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update "lastStmt" not allowed')
    WHERE NOT (new."lastStmt" == 0 OR new."lastStmt" == 1 OR new."lastStmt" == 2)
        OR (old."lastStmt" = 2 AND new."lastStmt" = 1); -- Untrash = trashed (2) -> inserted (0)
    UPDATE "Message" 
	SET "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL)
	WHERE "id" = new."id";
END;

CREATE TRIGGER IF NOT EXISTS "MessageAfterTrash"
    AFTER UPDATE OF
        "lastStmt"
    ON "Message"
    FOR EACH ROW
    WHEN (new."lastStmt" <> old."lastStmt" AND old."lastStmt" = 2) OR
            (new."lastStmt" <> old."lastStmt" AND new."lastStmt" = 2)
BEGIN
    UPDATE "MessageHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Message"
    SET "historyId"  = (SELECT "lastHistoryId" FROM "MessageHistorySeq" WHERE "userId" = old."userId"),
        "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL) 
    WHERE "id" = old."id";
END;

CREATE TRIGGER IF NOT EXISTS "MessageAfterDelete"
AFTER DELETE
ON "Message"
FOR EACH ROW
BEGIN
    UPDATE "MessageHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    INSERT INTO "MessageDeleted" ("id", "userId", "historyId")
      VALUES (old."id",
              old."userId",
              (SELECT "lastHistoryId" FROM "MessageHistorySeq" WHERE "userId" = old."userId"));
END;