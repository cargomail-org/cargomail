CREATE TRIGGER IF NOT EXISTS user_after_insert
    AFTER INSERT
    ON user
    FOR EACH ROW
BEGIN
    INSERT
        INTO file_timeline_seq (user_id, last_timeline_id)
        VALUES (new.id, 0);
    INSERT
        INTO file_history_seq (user_id, last_history_id)
        VALUES (new.id, 0);

    INSERT
        INTO message_timeline_seq (user_id, last_timeline_id)
        VALUES (new.id, 0);
    INSERT
        INTO message_history_seq (user_id, last_history_id)
        VALUES (new.id, 0);

    INSERT
        INTO user_label_timeline_seq (user_id, last_timeline_id)
        VALUES (new.id, 0);
    INSERT
        INTO user_label_history_seq (user_id, last_history_id)
        VALUES (new.id, 0);

    INSERT
        INTO shared_label_timeline_seq (last_timeline_id)
        VALUES (0);
    INSERT
        INTO shared_label_history_seq (last_history_id)
        VALUES (0);        

    INSERT
        INTO contact_timeline_seq (user_id, last_timeline_id)
        VALUES (new.id, 0);
    INSERT
        INTO contact_history_seq (user_id, last_history_id)
        VALUES (new.id, 0);
END;	