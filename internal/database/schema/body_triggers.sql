CREATE TRIGGER IF NOT EXISTS "BodyAfterInsert"
    AFTER INSERT
    ON "Body"
    FOR EACH ROW
BEGIN
    UPDATE "BodyTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = new."userId";
    UPDATE "BodyHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = new."userId";
    UPDATE "Body"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "bodyTimelineSeq" WHERE "userId" = new."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "bodyHistorySeq" WHERE "userId" = new."userId"),
        "lastStmt"   = 0
    WHERE "id" = new."id";
END;

CREATE TRIGGER IF NOT EXISTS "BodyBeforeUpdate"
    BEFORE UPDATE OF
        "id",
        "userId",
        -- "uri",
        -- "name",
        -- "snippet",
        "path",
        -- "size",
        "contentType"
    ON "Body"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update not allowed');
END;

CREATE TRIGGER IF NOT EXISTS "BodyAfterUpdate"
    AFTER UPDATE OF
        "uri",
        "name",
        "snippet",
        "size"
    ON "Body"
    FOR EACH ROW
BEGIN
    UPDATE "BodyTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = old."userId";
    UPDATE "BodyHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Body"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "BodyTimelineSeq" WHERE "userId" = old."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "BodyHistorySeq" WHERE "userId" = old."userId"),
        "lastStmt"   = 1,
        "modifiedAt" = CURRENT_TIMESTAMP
    WHERE "id" = old."id";
END;

-- Trashed
CREATE TRIGGER IF NOT EXISTS "BodyBeforeTrash"
    BEFORE UPDATE OF
        "lastStmt"
    ON "Body"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update "lastStmt" not allowed')
    WHERE NOT (new."lastStmt" == 0 OR new."lastStmt" == 2); -- Untrash = trashed (2) -> inserted (0)
  	UPDATE "Body" 
	SET "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL)
	WHERE "id" = new."id";
END;

CREATE TRIGGER IF NOT EXISTS "BodyAfterTrash"
    AFTER UPDATE OF
        "lastStmt"
    ON "Body"
    FOR EACH ROW
    WHEN (new."lastStmt" <> old."lastStmt" AND old."lastStmt" = 2) OR
         (new."lastStmt" <> old."lastStmt" AND new."lastStmt" = 2)
BEGIN
    UPDATE "BodyHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Body"
    SET "historyId"  = (SELECT "lastHistoryId" FROM "BodyHistorySeq" WHERE "userId" = old."userId"),
        "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL)
    WHERE "id" = old."id";
END;

CREATE TRIGGER IF NOT EXISTS "BodyAfterDelete"
AFTER DELETE
ON "Body"
FOR EACH ROW
BEGIN
    UPDATE "BodyHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    INSERT INTO "BodyDeleted" ("id", "userId", "historyId")
      VALUES (old."id",
              old."userId",
              (SELECT "lastHistoryId" FROM "BodyHistorySeq" WHERE "userId" = old."userId"));
END;