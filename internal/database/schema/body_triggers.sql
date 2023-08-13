CREATE TRIGGER IF NOT EXISTS body_after_insert
    AFTER INSERT
    ON body
    FOR EACH ROW
BEGIN
    UPDATE body_timeline_seq SET last_timeline_id = (last_timeline_id + 1) WHERE user_id = new.user_id;
    UPDATE body_history_seq SET last_history_id = (last_history_id + 1) WHERE user_id = new.user_id;
    UPDATE body
    SET timeline_id = (SELECT last_timeline_id FROM body_timeline_seq WHERE user_id = new.user_id),
        history_id  = (SELECT last_history_id FROM body_history_seq WHERE user_id = new.user_id),
        last_stmt   = 0
    WHERE id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS body_before_update
    BEFORE UPDATE OF
        id,
        user_id,
        -- uri,
        -- name,
        -- snippet,
        path,
        -- size,
        content_type
    ON body
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update not allowed');
END;

CREATE TRIGGER IF NOT EXISTS body_after_update
    AFTER UPDATE OF
        uri,
        name,
        snippet,
        size
    ON body
    FOR EACH ROW
BEGIN
    UPDATE body_timeline_seq SET last_timeline_id = (last_timeline_id + 1) WHERE user_id = old.user_id;
    UPDATE body_history_seq SET last_history_id = (last_history_id + 1) WHERE user_id = old.user_id;
    UPDATE body
    SET timeline_id = (SELECT last_timeline_id FROM body_timeline_seq WHERE user_id = old.user_id),
        history_id  = (SELECT last_history_id FROM body_history_seq WHERE user_id = old.user_id),
        last_stmt   = 1,
        modified_at = CURRENT_TIMESTAMP
    WHERE id = old.id;
END;

-- Trashed
CREATE TRIGGER IF NOT EXISTS body_before_trash
    BEFORE UPDATE OF
        last_stmt
    ON body
    FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Update "last_stmt" not allowed')
    WHERE NOT (new.last_stmt == 0 OR new.last_stmt == 2); -- Untrash = trashed (2) -> inserted (0)
  	UPDATE body 
	SET device_id = iif(length(new.device_id) = 39 AND substr(new.device_id, 1, 7) = 'device:', substr(new.device_id, 8, 32), NULL)
	WHERE id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS body_after_trash
    AFTER UPDATE OF
        last_stmt
    ON body
    FOR EACH ROW
    WHEN (new.last_stmt <> old.last_stmt AND old.last_stmt = 2) OR
         (new.last_stmt <> old.last_stmt AND new.last_stmt = 2)
BEGIN
    UPDATE body_history_seq SET last_history_id = (last_history_id + 1) WHERE user_id = old.user_id;
    UPDATE body
    SET history_id  = (SELECT last_history_id FROM body_history_seq WHERE user_id = old.user_id),
        device_id = iif(length(new.device_id) = 39 AND substr(new.device_id, 1, 7) = 'device:', substr(new.device_id, 8, 32), NULL)
    WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS body_after_delete
AFTER DELETE
ON body
FOR EACH ROW
BEGIN
    UPDATE body_history_seq SET last_history_id = (last_history_id + 1) WHERE user_id = old.user_id;
    INSERT INTO body_deleted (id, user_id, history_id)
      VALUES (old.id,
              old.user_id,
              (SELECT last_history_id FROM body_history_seq WHERE user_id = old.user_id));
END;