CREATE TRIGGER IF NOT EXISTS "DraftAfterInsert"
    AFTER INSERT
    ON "Draft"
    FOR EACH ROW
BEGIN
    UPDATE "DraftTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = new."userId";
    UPDATE "DraftHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = new."userId";
    UPDATE message
    SET "timelineId" = (SELECT "lastTimelineId" FROM "DraftTimelineSeq" WHERE "userId" = new."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "DraftHistorySeq" WHERE "userId" = new."userId"),
        "lastStmt"   = 0
    WHERE "uri" = new."uri";
END;

CREATE TRIGGER IF NOT EXISTS "DraftBeforeUpdate"
    BEFORE UPDATE OF
    "uri",
    "userId",
    "messageUid",
    "parentUid",
    "threadUid"
    -- "unread", 
    -- "starred", 
    -- "payload",
    -- "labelIds"
    ON "Draft"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update not allowed');
END;

CREATE TRIGGER IF NOT EXISTS "DraftAfterUpdate"
    AFTER UPDATE OF
        "payload"
    ON "Draft"
    FOR EACH ROW
BEGIN
    UPDATE "DraftTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = old."userId";
    UPDATE "DraftHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Draft"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "DraftTimelineSeq" WHERE "userId" = old."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "DraftHistorySeq" WHERE "userId" = old."userId"),
        "lastStmt"   = 1,
        "modifiedAt" = CURRENT_TIMESTAMP
    WHERE "uri" = old."uri";
END;

-- Trashed
CREATE TRIGGER IF NOT EXISTS "DraftBeforeTrash"
    BEFORE UPDATE OF
        "lastStmt"
    ON "Draft"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update "lastStmt" not allowed')
    WHERE NOT (new."lastStmt" == 0 OR new."lastStmt" == 1 OR new."lastStmt" == 2)
        OR (old."lastStmt" = 2 AND new."lastStmt" = 1); -- Untrash = trashed (2) -> inserted (0)
    UPDATE "Draft" 
	SET "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL)
	WHERE "uri" = new."uri";
END;

CREATE TRIGGER IF NOT EXISTS "DraftAfterTrash"
    AFTER UPDATE OF
        "lastStmt"
    ON "Draft"
    FOR EACH ROW
    WHEN (new."lastStmt" <> old."lastStmt" AND old."lastStmt" = 2) OR
            (new."lastStmt" <> old."lastStmt" AND new."lastStmt" = 2)
BEGIN
    UPDATE "DraftHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Draft"
    SET "historyId"  = (SELECT "lastHistoryId" FROM "DraftHistorySeq" WHERE "userId" = old."userId"),
        "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL) 
    WHERE "uri" = old."uri";
END;

CREATE TRIGGER IF NOT EXISTS "DraftAfterDelete"
AFTER DELETE
ON "Draft"
FOR EACH ROW
BEGIN
    UPDATE "DraftHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    INSERT INTO "DraftDeleted" ("uri", "userId", "historyId")
      VALUES (old."uri",
              old."userId",
              (SELECT "lastHistoryId" FROM "DraftHistorySeq" WHERE "userId" = old."userId"));
END;