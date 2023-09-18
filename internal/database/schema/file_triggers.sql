CREATE TRIGGER IF NOT EXISTS "FileAfterInsert"
    AFTER INSERT
    ON "File"
    FOR EACH ROW
BEGIN
    UPDATE "FileTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = new."userId";
    UPDATE "FileHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = new."userId";
    UPDATE "File"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "FileTimelineSeq" WHERE "userId" = new."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "FileHistorySeq" WHERE "userId" = new."userId"),
        "lastStmt"   = 0
    WHERE "uri" = new."uri";
END;

CREATE TRIGGER IF NOT EXISTS "FileBeforeUpdate"
    BEFORE UPDATE OF
        "uri",
        "userId",
        "folder",
        "digest",
        "name",
        "path",
        "size",
        "contentType"
    ON "File"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update not allowed');
END;

-- Trashed
CREATE TRIGGER IF NOT EXISTS "FileBeforeTrash"
    BEFORE UPDATE OF
        "lastStmt"
    ON "File"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update "lastStmt" not allowed')
    WHERE NOT (new."lastStmt" == 0 OR new."lastStmt" == 2); -- Untrash = trashed (2) -> inserted (0)
  	UPDATE "File" 
	SET "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL)
	WHERE "uri" = new."uri";
END;

CREATE TRIGGER IF NOT EXISTS "FileAfterTrash"
    AFTER UPDATE OF
        "lastStmt"
    ON "File"
    FOR EACH ROW
    WHEN (new."lastStmt" <> old."lastStmt" AND old."lastStmt" = 2) OR
         (new."lastStmt" <> old."lastStmt" AND new."lastStmt" = 2)
BEGIN
    UPDATE "FileHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "File"
    SET "historyId"  = (SELECT "lastHistoryId" FROM "FileHistorySeq" WHERE "userId" = old."userId"),
        "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL)
    WHERE "uri" = old."uri";
END;

CREATE TRIGGER IF NOT EXISTS "FileAfterDelete"
AFTER DELETE
ON "File"
FOR EACH ROW
BEGIN
    UPDATE "FileHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    INSERT INTO "FileDeleted" ("uri", "userId", "historyId")
      VALUES (old."uri",
              old."userId",
              (SELECT "lastHistoryId" FROM "FileHistorySeq" WHERE "userId" = old."userId"));
END;