CREATE TRIGGER IF NOT EXISTS message_after_insert
    AFTER INSERT
    ON message
    FOR EACH ROW
BEGIN
    UPDATE message_timeline_seq SET last_timeline_id = (last_timeline_id + 1) WHERE user_id = new.user_id;
    UPDATE message_history_seq SET last_history_id = (last_history_id + 1) WHERE user_id = new.user_id;
    UPDATE message
    SET timeline_id = (SELECT last_timeline_id FROM message_timeline_seq WHERE user_id = new.user_id),
        history_id  = (SELECT last_history_id FROM message_history_seq WHERE user_id = new.user_id),
        last_stmt   = 0
    WHERE id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS message_draft_before_update
    BEFORE UPDATE OF
    id,
    user_id,
    -- message_uid,
    -- parent_uid,
    -- thread_uid,
    -- forwarded,
    -- unread, 
    -- starred, 
    -- folder,
    -- headers,
    -- body,
    -- files,
    -- "from",
    -- "to",
    -- "cc",
    -- "bcc",
    -- "group",
    -- label_ids,
    sent_at,
    received_at,
    snoozed_at
    ON message
    FOR EACH ROW
    WHEN old.folder = 0 -- draft
BEGIN
    SELECT RAISE(ABORT, 'Update not allowed');
END;

CREATE TRIGGER IF NOT EXISTS message_not_draft_before_update
    BEFORE UPDATE OF
    id,
    user_id,
    message_uid,
    parent_uid,
    thread_uid,
    forwarded,
    -- unread, 
    -- starred, 
    folder,
    -- headers,
    -- body,
    -- files,
    "from",
    "to",
    "cc",
    "bcc",
    "group",
    -- label_ids,
    sent_at,
    received_at,
    snoozed_at
    ON message
    FOR EACH ROW
    WHEN old.folder > 0 -- not draft
BEGIN
    SELECT RAISE(ABORT, 'Update not allowed');
END;

CREATE TRIGGER IF NOT EXISTS message_after_update
    AFTER UPDATE OF
    "from",
    "to",
    "cc",
    "bcc",
    "group"
    ON message
    FOR EACH ROW
BEGIN
    UPDATE message_timeline_seq SET last_timeline_id = (last_timeline_id + 1) WHERE user_id = old.user_id;
    UPDATE message_history_seq SET last_history_id = (last_history_id + 1) WHERE user_id = old.user_id;
    UPDATE message
    SET timeline_id = (SELECT last_timeline_id FROM message_timeline_seq WHERE user_id = old.user_id),
        history_id  = (SELECT last_history_id FROM message_history_seq WHERE user_id = old.user_id),
        last_stmt   = 1,
        modified_at = CURRENT_TIMESTAMP
    WHERE id = old.id;
END;

-- Trashed
CREATE TRIGGER IF NOT EXISTS message_before_trash
    BEFORE UPDATE OF
        last_stmt
    ON message
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update "last_stmt" not allowed')
    WHERE NOT (new.last_stmt == 0 OR new.last_stmt == 1 OR new.last_stmt == 2)
        OR (old.last_stmt = 2 AND new.last_stmt = 1); -- Untrash = trashed (2) -> inserted (0)
    UPDATE message 
	SET device_id = iif(length(new.device_id) = 39 AND substr(new.device_id, 1, 7) = 'device:', substr(new.device_id, 8, 32), NULL)
	WHERE id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS message_after_trash
    AFTER UPDATE OF
        last_stmt
    ON message
    FOR EACH ROW
    WHEN (new.last_stmt <> old.last_stmt AND old.last_stmt = 2) OR
            (new.last_stmt <> old.last_stmt AND new.last_stmt = 2)
BEGIN
    UPDATE message_history_seq SET last_history_id = (last_history_id + 1) WHERE user_id = old.user_id;
    UPDATE message
    SET history_id  = (SELECT last_history_id FROM message_history_seq WHERE user_id = old.user_id),
        device_id = iif(length(new.device_id) = 39 AND substr(new.device_id, 1, 7) = 'device:', substr(new.device_id, 8, 32), NULL) 
    WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS message_after_delete
AFTER DELETE
ON message
FOR EACH ROW
BEGIN
    UPDATE message_history_seq SET last_history_id = (last_history_id + 1) WHERE user_id = old.user_id;
    INSERT INTO message_deleted (id, user_id, history_id)
      VALUES (old.id,
              old.user_id,
              (SELECT last_history_id FROM message_history_seq WHERE user_id = old.user_id));
END;