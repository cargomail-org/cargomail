CREATE TRIGGER IF NOT EXISTS "UserAfterInsert"
    AFTER INSERT
    ON "User"
    FOR EACH ROW
BEGIN

    INSERT
        INTO "BodyTimelineSeq" ("userId", "lastTimelineId")
        VALUES (new."id", 0);
    INSERT
        INTO "BodyHistorySeq" ("userId", "lastHistoryId")
        VALUES (new."id", 0);

    INSERT
        INTO "FileTimelineSeq" ("userId", "lastTimelineId")
        VALUES (new."id", 0);
    INSERT
        INTO "FileHistorySeq" ("userId", "lastHistoryId")
        VALUES (new."id", 0);

    INSERT
        INTO "DraftTimelineSeq" ("userId", "lastTimelineId")
        VALUES (new."id", 0);
    INSERT
        INTO "DraftHistorySeq" ("userId", "lastHistoryId")
        VALUES (new."id", 0);        

    INSERT
        INTO "MessageTimelineSeq" ("userId", "lastTimelineId")
        VALUES (new."id", 0);
    INSERT
        INTO "MessageHistorySeq" ("userId", "lastHistoryId")
        VALUES (new."id", 0);

    INSERT
        INTO "LabelTimelineSeq" ("userId", "lastTimelineId")
        VALUES (new."id", 0);
    INSERT
        INTO "LabelHistorySeq" ("userId", "lastHistoryId")
        VALUES (new."id", 0);  

    INSERT
        INTO "ContactTimelineSeq" ("userId", "lastTimelineId")
        VALUES (new."id", 0);
    INSERT
        INTO "ContactHistorySeq" ("userId", "lastHistoryId")
        VALUES (new."id", 0);
END;	