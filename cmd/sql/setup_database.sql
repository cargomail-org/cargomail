do $do$
DECLARE 
BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

    IF EXISTS (SELECT DISTINCT table_schema FROM information_schema.tables WHERE table_schema = 'fedemail') THEN
        RAISE WARNING 'database schema "fedemail" already exists -> drop & create';
        DROP SCHEMA fedemail CASCADE;
    END IF;

    CREATE SCHEMA fedemail;

    CREATE SEQUENCE fedemail.timeline_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;  

    CREATE SEQUENCE fedemail.thread_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;

    CREATE TABLE fedemail.label (
        id BIGSERIAL PRIMARY KEY,
        owner character varying(255) NOT NULL,
        name character varying(255) NOT NULL,
        type int NOT NULL DEFAULT 0,
        payload JSONB
    );	

    CREATE TABLE fedemail.message (
        id BIGSERIAL PRIMARY KEY,
        owner character varying(255) NOT NULL,
        thread_id bigint DEFAULT nextval('fedemail.thread_id_seq'::regclass) NOT NULL,
        snippet character varying(255),
        payload JSONB,
        labels JSONB,
        timeline_id bigint DEFAULT nextval('fedemail.timeline_id_seq'::regclass) NOT NULL,
        search_subject tsvector,
        search_from tsvector,
        search_recipients tsvector
    );

    -- CREATE INDEX idx_message_payload_message_id ON fedemail.message USING gin ((payload->'Message-ID'));
    -- CREATE INDEX idx_message_payload_in_reply_to ON fedemail.message USING gin ((payload->'In-Reply-To'));
    -- CREATE INDEX idx_message_payload_references ON fedemail.message USING gin ((payload->'References'));
    -- CREATE INDEX idx_message_payload_subject ON fedemail.message USING gin ((payload->'Subject'));
    -- CREATE INDEX idx_message_payload_from ON fedemail.message USING gin ((payload->'From'));
    -- CREATE INDEX idx_message_payload_recipients_to ON fedemail.message USING gin ((payload->'Recipients'->'To'));
    -- CREATE INDEX idx_message_payload_recipients_cc ON fedemail.message USING gin ((payload->'Recipients'->'Cc'));
    -- CREATE INDEX idx_message_payload_recipients_bcc ON fedemail.message USING gin ((payload->'Recipients'->'Bcc'));

    -- CREATE INDEX idx_message_labels ON fedemail.message USING gin (labels);

    CREATE FUNCTION fedemail.message_table_inserted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    begin
        -- -- NEW.payload['Message_ID'] = to_json(public.gen_random_uuid()::text);
        -- NEW.search_subject = to_tsvector(NEW.payload['Subject']);
        -- NEW.search_from = to_tsvector(NEW.payload['From']);
        -- NEW.search_recipients = to_tsvector(NEW.payload['Recipients']);
        RETURN NEW;	
    END; $$;

    CREATE TRIGGER message_message_inserted BEFORE INSERT ON fedemail.message FOR EACH ROW EXECUTE PROCEDURE fedemail.message_table_inserted();

    CREATE OR REPLACE FUNCTION fedemail.labels_list(IN _owner character varying)
    RETURNS TABLE(label jsonb) AS
    $BODY$
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        RETURN QUERY
            SELECT jsonb_build_object('id', CASE WHEN (type = 0) THEN name ELSE CONCAT('Label_', id::varchar(255)) END,
                                    'name', name,
                                    'message_list_visibility', payload['messageListVisibility'],
                                    'label_list_visibility', payload['labelListVisibility'],
                                    'type', type) FROM fedemail.label
                WHERE owner = _owner;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION fedemail.threads_list(IN _owner character varying)
    RETURNS TABLE(thread jsonb) AS
    $BODY$
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        RETURN QUERY
            SELECT DISTINCT
                (SELECT jsonb_build_object('id', detail.thread_id::varchar(255),
                                        'snippet', detail.snippet,
                                        'history_id', detail.timeline_id::varchar(255)) FROM fedemail.message detail
                WHERE thread_id = master.thread_id 
                ORDER BY timeline_id DESC LIMIT 1)
            FROM fedemail.message AS master
            WHERE owner = _owner;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION fedemail.threads_get(IN _owner character varying, IN _thread_id bigint)
    RETURNS TABLE(thread jsonb) AS
    $BODY$
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        RETURN QUERY
        SELECT jsonb_build_object('id', id::varchar(255),
                                        'thread_id', thread_id::varchar(255),
                                        'snippet', snippet,
                                        'payload', payload,
                                        'label_ids', labels,
                                        'history_id', timeline_id::varchar(255)) FROM fedemail.message
                WHERE owner = _owner AND thread_id = _thread_id 
                ORDER BY timeline_id DESC;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION fedemail.drafts_delete(IN _owner character varying, IN _id bigint)
    RETURNS bigint AS
    $BODY$
    DECLARE
        _removed_cnt bigint = 0;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        WITH affected_rows AS (
            DELETE FROM fedemail.message
                WHERE id = _id AND owner = _owner AND
                jsonb_path_exists(labels, 'strict $[*] ? (@ == "DRAFT")') RETURNING 1
        ) SELECT COUNT(*) INTO _removed_cnt
            FROM affected_rows;		
        RETURN _removed_cnt;			
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    RAISE INFO 'database schema "fedemail" created';

----------------------------------------------------------------------------------------------------------------------

    IF EXISTS (SELECT DISTINCT table_schema FROM information_schema.tables WHERE table_schema = 'people') THEN
        RAISE WARNING 'database schema "people" already exists -> drop & create';
        DROP SCHEMA people CASCADE;
    END IF;

    CREATE SCHEMA people;

    CREATE SEQUENCE people.timeline_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;   

    CREATE TABLE people.connection (
        id BIGSERIAL PRIMARY KEY,
        owner character varying(255) NOT NULL,
        names JSONB,
        email_addresses JSONB,
        timeline_id bigint DEFAULT nextval('people.timeline_id_seq'::regclass) NOT NULL,
        search_names tsvector,
        search_email_addresses tsvector
    );

    CREATE INDEX idx_connection_names ON people.connection USING gin (names);
    CREATE INDEX idx_connection_email_addresses ON people.connection USING gin (email_addresses);

    CREATE FUNCTION people.connection_table_inserted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    begin
        NEW.search_names = to_tsvector(NEW.names);
        NEW.search_email_addresses = to_tsvector(NEW.email_addresses);
        RETURN NEW;	
    END; $$;

    CREATE FUNCTION people.connection_table_updated() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ 
    begin
        NEW.timeline_id := nextval('email.timeline_id_seq'::regclass);
        NEW.search_names = to_tsvector(NEW.names);
        NEW.search_email_addresses = to_tsvector(NEW.email_addresses);
        RETURN NEW; 
    END; $$;

    CREATE TRIGGER people_connection_inserted BEFORE INSERT ON people.connection FOR EACH ROW EXECUTE PROCEDURE people.connection_table_inserted();
    CREATE TRIGGER people_connection_updated BEFORE UPDATE ON people.connection FOR EACH ROW EXECUTE PROCEDURE people.connection_table_updated();

    CREATE OR REPLACE FUNCTION people.connections_list(IN _owner character varying)
    RETURNS TABLE(thread jsonb) AS
    $BODY$
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        RETURN QUERY
            SELECT jsonb_build_object('resource_name', id::varchar(255),
                                    'names', names,
                                    'email_addresses', email_addresses,
                                    'history_id', timeline_id::varchar(255))
            FROM people.connection
            WHERE owner = _owner
            ORDER BY timeline_id DESC;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    RAISE INFO 'database schema "people" created';
END
$do$;