CREATE TRIGGER IF NOT EXISTS "ContactAfterInsert"
    AFTER INSERT
    ON "Contact"
    FOR EACH ROW
BEGIN
    UPDATE "ContactTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = new."userId";
    UPDATE "ContactHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = new."userId";
    UPDATE "Contact"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "ContactTimelineSeq" WHERE "userId" = new."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "ContactHistorySeq" WHERE "userId" = new."userId"),
        "lastStmt"   = 0
    WHERE "id" = new."id";
END;

CREATE TRIGGER IF NOT EXISTS "ContactBeforeUpdate"
    BEFORE UPDATE OF
        "id",
        "userId"
    ON "Contact"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update not allowed');
END;

CREATE TRIGGER IF NOT EXISTS "ContactAfterUpdate"
    AFTER UPDATE OF
        "emailAddress",
        "firstName",
        "lastName"
    ON "Contact"
    FOR EACH ROW
BEGIN
    UPDATE "ContactTimelineSeq" SET "lastTimelineId" = ("lastTimelineId" + 1) WHERE "userId" = old."userId";
    UPDATE "ContactHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Contact"
    SET "timelineId" = (SELECT "lastTimelineId" FROM "ContactTimelineSeq" WHERE "userId" = old."userId"),
        "historyId"  = (SELECT "lastHistoryId" FROM "ContactHistorySeq" WHERE "userId" = old."userId"),
        "lastStmt"   = 1,
        "modifiedAt" = CURRENT_TIMESTAMP
    WHERE "id" = old."id";
END;

-- Trashed
CREATE TRIGGER IF NOT EXISTS "ContactBeforeTrash"
    BEFORE UPDATE OF
        "lastStmt"
    ON "Contact"
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update "lastStmt" not allowed')
    WHERE NOT (new."lastStmt" == 0 OR new."lastStmt" == 1 OR new."lastStmt" == 2)
        OR (old."lastStmt" = 2 AND new."lastStmt" = 1); -- Untrash = trashed (2) -> inserted (0)
    UPDATE "Contact" 
	SET "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL)
	WHERE "id" = new."id";
END;

CREATE TRIGGER IF NOT EXISTS "ContactAfterTrash"
    AFTER UPDATE OF
        "lastStmt"
    ON "Contact"
    FOR EACH ROW
    WHEN (new."lastStmt" <> old."lastStmt" AND old."lastStmt" = 2) OR
            (new."lastStmt" <> old."lastStmt" AND new."lastStmt" = 2)
BEGIN
    UPDATE "ContactHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    UPDATE "Contact"
    SET "historyId"  = (SELECT "lastHistoryId" FROM "ContactHistorySeq" WHERE "userId" = old."userId"),
        "deviceId" = iif(length(new."deviceId") = 39 AND substr(new."deviceId", 1, 7) = 'device:', substr(new."deviceId", 8, 32), NULL) 
    WHERE "id" = old."id";
END;

CREATE TRIGGER IF NOT EXISTS "ContactAfterDelete"
AFTER DELETE
ON "Contact"
FOR EACH ROW
BEGIN
    UPDATE "ContactHistorySeq" SET "lastHistoryId" = ("lastHistoryId" + 1) WHERE "userId" = old."userId";
    INSERT INTO "ContactDeleted" ("id", "userId", "historyId")
      VALUES (old."id",
              old."userId",
              (SELECT "lastHistoryId" FROM "ContactHistorySeq" WHERE "userId" = old."userId"));
END;