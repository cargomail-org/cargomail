CREATE TRIGGER IF NOT EXISTS "BlobAfterInsert"
    AFTER INSERT
    ON "Blob"
    FOR EACH ROW
BEGIN
    UPDATE "BlobTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = new."userId";
    UPDATE "BlobHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = new."userId";
    UPDATE "Blob"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "BlobTimelineSeq" WHERE "userId" = new."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "BlobHistorySeq" WHERE "userId" = new."userId"),
        "lastStmt"   = 0
    WHERE "uri" = new."uri";
END;

CREATE TRIGGER IF NOT EXISTS "BlobBeforeUpdate"
    BEFORE UPDATE OF
        "uri",
        "userId",
        -- "hash",
        -- "name",
        -- "snippet",
        "path",
        -- "size",
        "contentType"
    ON "Blob"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update not allowed');
END;

CREATE TRIGGER IF NOT EXISTS "BlobAfterUpdate"
    AFTER UPDATE OF
        "hash",
        "name",
        "snippet",
        "size"
    ON "Blob"
    FOR EACH ROW
BEGIN
    UPDATE "BlobTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = old."userId";
    UPDATE "BlobHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Blob"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "BlobTimelineSeq" WHERE "userId" = old."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "BlobHistorySeq" WHERE "userId" = old."userId"),
        "lastStmt"   = 1,
        "modifiedAt" = CURRENT_TIMESTAMP
    WHERE "uri" = old."uri";
END;

-- Trashed
CREATE TRIGGER IF NOT EXISTS "BlobBeforeTrash"
    BEFORE UPDATE OF
        "lastStmt"
    ON "Blob"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update "lastStmt" not allowed')
    WHERE NOT (new."lastStmt" == 0 OR new."lastStmt" == 1 OR new."lastStmt" == 2)
        OR (old."lastStmt" = 2 AND new."lastStmt" = 1); -- Untrash = trashed (2) -> inserted (0)
  	UPDATE "Blob" 
	SET "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL)
	WHERE "uri" = new."uri";
END;

CREATE TRIGGER IF NOT EXISTS "BlobAfterTrash"
    AFTER UPDATE OF
        "lastStmt"
    ON "Blob"
    FOR EACH ROW
    WHEN (new."lastStmt" <> old."lastStmt" AND old."lastStmt" = 2) OR
         (new."lastStmt" <> old."lastStmt" AND new."lastStmt" = 2)
BEGIN
    UPDATE "BlobHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Blob"
    SET "historyId"  = (SELECT "lastHistoryId" FROM "BlobHistorySeq" WHERE "userId" = old."userId"),
        "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL)
    WHERE "uri" = old."uri";
END;

CREATE TRIGGER IF NOT EXISTS "BlobAfterDelete"
AFTER DELETE
ON "Blob"
FOR EACH ROW
BEGIN
    UPDATE "BlobHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    INSERT INTO "BlobDeleted" ("uri", "userId", "historyId")
      VALUES (old."uri",
              old."userId",
              (SELECT "lastHistoryId" FROM "BlobHistorySeq" WHERE "userId" = old."userId"));
END;