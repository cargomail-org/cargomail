CREATE TRIGGER IF NOT EXISTS "LabelAfterInsert"
    AFTER INSERT
    ON "Label"
    FOR EACH ROW
BEGIN
    UPDATE "LabelTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = new."userId";
    UPDATE "LabelHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = new."userId";
    UPDATE "Label"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "LabelTimelineSeq" WHERE "userId" = new."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "LabelHistorySeq" WHERE "userId" = new."userId"),
        "lastStmt"   = 0
    WHERE "uri" = new."uri";
END;

CREATE TRIGGER IF NOT EXISTS "LabelBeforeUpdate"
    BEFORE UPDATE OF
        "uri",
        "userId"
    ON "Label"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update not allowed');
END;

CREATE TRIGGER IF NOT EXISTS "LabelAfterUpdate"
    AFTER UPDATE OF
        name
    ON "Label"
    FOR EACH ROW
BEGIN
    UPDATE "LabelTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = old."userId";
    UPDATE "LabelHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Label"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "LabelTimelineSeq" WHERE "userId" = old."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "LabelHistorySeq" WHERE "userId" = old."userId"),
        "lastStmt"   = 1,
        "modifiedAt" = CURRENT_TIMESTAMP
    WHERE "uri" = old."uri";
END;

-- Trashed
CREATE TRIGGER IF NOT EXISTS "LabelBeforeTrash"
    BEFORE UPDATE OF
        "lastStmt"
    ON "Label"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update "lastStmt" not allowed')
    WHERE NOT (new."lastStmt" == 0 OR new."lastStmt" == 1 OR new."lastStmt" == 2)
        OR (old."lastStmt" = 2 AND new."lastStmt" = 1); -- Untrash = trashed (2) -> inserted (0)
    UPDATE "Label" 
	SET "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL)
	WHERE "uri" = new."uri";
END;

CREATE TRIGGER IF NOT EXISTS "LabelAfterTrash"
    AFTER UPDATE OF
        "lastStmt"
    ON "Label"
    FOR EACH ROW
    WHEN (new."lastStmt" <> old."lastStmt" AND old."lastStmt" = 2) OR
            (new."lastStmt" <> old."lastStmt" AND new."lastStmt" = 2)
BEGIN
    UPDATE "LabelHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Label"
    SET "historyId"  = (SELECT "lastHistoryId" FROM "LabelHistorySeq" WHERE "userId" = old."userId"),
        "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL) 
    WHERE "uri" = old."uri";
END;

CREATE TRIGGER IF NOT EXISTS "LabelAfterDelete"
AFTER DELETE
ON "Label"
FOR EACH ROW
BEGIN
    UPDATE "LabelHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    INSERT INTO "LabelDeleted" ("uri", "userId", "historyId")
      VALUES (old."uri",
              old."userId",
              (SELECT "lastHistoryId" FROM "LabelHistorySeq" WHERE "userId" = old."userId"));
END;