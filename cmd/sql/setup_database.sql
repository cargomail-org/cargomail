do $main$
DECLARE 
BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

    IF EXISTS (SELECT DISTINCT table_schema FROM information_schema.tables WHERE table_schema = 'fedemail') THEN
        RAISE WARNING 'database schema "fedemail" already exists -> drop & create';
        DROP SCHEMA fedemail CASCADE;
    END IF;

    CREATE SCHEMA fedemail;

    CREATE SEQUENCE fedemail.history_id_seq
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

    CREATE SEQUENCE fedemail.draft_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;

    CREATE SEQUENCE fedemail.message_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;

    CREATE SEQUENCE fedemail.attachment_id_seq
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
        id bigint DEFAULT nextval('fedemail.message_id_seq'::regclass) PRIMARY KEY,
        owner character varying(255) NOT NULL,
        thread_id bigint DEFAULT nextval('fedemail.thread_id_seq'::regclass) NOT NULL,
        draft_id bigint,
        snippet character varying(255),
        raw TEXT,
        payload JSONB,
        labels JSONB,
        history_id bigint DEFAULT nextval('fedemail.history_id_seq'::regclass) NOT NULL,
        internal_date bigint DEFAULT extract(epoch from now()) NOT NULL,
        search_subject tsvector,
        search_from tsvector,
        search_recipients tsvector
    );

    CREATE TABLE fedemail.attachment (
        id bigint DEFAULT nextval('fedemail.attachment_id_seq'::regclass) PRIMARY KEY,
        owner character varying(255) NOT NULL,
        filename character varying(255) NOT NULL,
        content_type character varying(255) NOT NULL,
        content_uri character varying(255) NOT NULL,
        payload JSONB,
        history_id bigint DEFAULT nextval('fedemail.history_id_seq'::regclass) NOT NULL,
        internal_date bigint DEFAULT extract(epoch from now()) NOT NULL,
        search_content_type tsvector,
        search_filename tsvector,
        search_content tsvector
    );

    CREATE UNIQUE INDEX idx_message_draft_id ON fedemail.message(draft_id);

    -- CREATE INDEX idx_message_payload_message_id ON fedemail.message USING gin ((payload->'Message-ID'));
    -- CREATE INDEX idx_message_payload_in_reply_to ON fedemail.message USING gin ((payload->'In-Reply-To'));
    -- CREATE INDEX idx_message_payload_references ON fedemail.message USING gin ((payload->'References'));
    -- CREATE INDEX idx_message_payload_subject ON fedemail.message USING gin ((payload->'Subject'));
    -- CREATE INDEX idx_message_payload_from ON fedemail.message USING gin ((payload->'From'));
    -- CREATE INDEX idx_message_payload_recipients_to ON fedemail.message USING gin ((payload->'Recipients'->'To'));
    -- CREATE INDEX idx_message_payload_recipients_cc ON fedemail.message USING gin ((payload->'Recipients'->'Cc'));
    -- CREATE INDEX idx_message_payload_recipients_bcc ON fedemail.message USING gin ((payload->'Recipients'->'Bcc'));

    -- CREATE INDEX idx_message_labels ON fedemail.message USING gin (labels);

    CREATE OR REPLACE FUNCTION fedemail.message_table_inserted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    begin
        -- -- NEW.payload['Message_ID'] = to_jsonb(public.gen_random_uuid()::text);
        -- NEW.search_subject = to_tsvector(NEW.payload['Subject']);
        -- NEW.search_from = to_tsvector(NEW.payload['From']);
        -- NEW.search_recipients = to_tsvector(NEW.payload['Recipients']);
        RETURN NEW;	
    END; $$;

    CREATE OR REPLACE FUNCTION fedemail.message_table_updated() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ 
    begin
        if (NEW.payload <> OLD.payload) then
            NEW.history_id := nextval('fedemail.history_id_seq'::regclass);
        end if;
        RETURN NEW; 
    END; $$;

    CREATE TRIGGER message_inserted BEFORE INSERT ON fedemail.message FOR EACH ROW EXECUTE PROCEDURE fedemail.message_table_inserted();
    CREATE TRIGGER message_updated BEFORE UPDATE ON fedemail.message FOR EACH ROW EXECUTE PROCEDURE fedemail.message_table_updated();

    CREATE OR REPLACE FUNCTION fedemail.attachment_table_inserted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    begin
        -- -- NEW.payload['Message_ID'] = to_jsonb(public.gen_random_uuid()::text);
        -- NEW.search_subject = to_tsvector(NEW.payload['Subject']);
        -- NEW.search_from = to_tsvector(NEW.payload['From']);
        -- NEW.search_recipients = to_tsvector(NEW.payload['Recipients']);
        RETURN NEW;	
    END; $$;

    CREATE OR REPLACE FUNCTION fedemail.attachment_table_updated() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ 
    begin
        if (NEW.payload <> OLD.payload) then
            NEW.history_id := nextval('fedemail.history_id_seq'::regclass);
        end if;
        RETURN NEW; 
    END; $$;

    CREATE TRIGGER attachment_inserted BEFORE INSERT ON fedemail.attachment FOR EACH ROW EXECUTE PROCEDURE fedemail.attachment_table_inserted();
    CREATE TRIGGER attachment_updated BEFORE UPDATE ON fedemail.attachment FOR EACH ROW EXECUTE PROCEDURE fedemail.attachment_table_updated();


    CREATE OR REPLACE FUNCTION fedemail.labels_list_v1(IN _owner character varying)
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

    CREATE OR REPLACE FUNCTION fedemail.threads_list_v1(IN _owner character varying)
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
                                        'history_id', detail.history_id::varchar(255),
                                        'internal_date', detail.internal_date::varchar(255) || '000') FROM fedemail.message detail
                WHERE thread_id = master.thread_id 
                ORDER BY history_id DESC LIMIT 1)
            FROM fedemail.message AS master
            WHERE owner = _owner;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION fedemail.threads_get_v1(IN _owner character varying, IN _thread_id bigint)
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
                                        'history_id', history_id::varchar(255),
                                        'internal_date', internal_date::varchar(255) || '000') FROM fedemail.message
                WHERE owner = _owner AND thread_id = _thread_id 
                ORDER BY history_id ASC;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION fedemail.drafts_list_v1(IN _owner character varying)
    RETURNS TABLE(draft jsonb) AS
    $BODY$
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        RETURN QUERY
            SELECT jsonb_build_object('id', draft_id::varchar(255),
                                    'message', jsonb_build_object(
                                        'id', id::varchar(255),
                                        'thread_id', thread_id::varchar(255))
                                    ) FROM fedemail.message                                   
                WHERE owner = _owner AND draft_id IS NOT NULL
                ORDER BY history_id DESC;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION fedemail.drafts_get_v1(IN _owner character varying, IN _id bigint)
    RETURNS jsonb AS
    $BODY$
    DECLARE
      _draft jsonb;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        SELECT jsonb_build_object('id', draft_id::varchar(255),
                                    'message', jsonb_build_object(
                                        'id', id::varchar(255),
                                        'thread_id', thread_id::varchar(255),
                                        'snippet', snippet,
                                        'payload', payload,
                                        'label_ids', labels,
                                        'history_id', history_id::varchar(255),
                                        'internal_date', internal_date::varchar(255) || '000')
                                    ) FROM fedemail.message
                WHERE owner = _owner AND draft_id = _id
                INTO _draft;
		RETURN _draft;                   
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION fedemail.drafts_create_v1(IN _owner character varying, IN _payload jsonb)
    RETURNS jsonb AS
    $BODY$
    DECLARE
     _labels jsonb;
     _new_draft jsonb;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        _labels = to_jsonb('["DRAFT"]'::json);

        INSERT INTO fedemail.message(owner, draft_id, payload, labels)
            VALUES (_owner, nextval('fedemail.draft_id_seq'::regclass), _payload, _labels)
            RETURNING jsonb_build_object('id', draft_id::varchar(255),
                                         'message', jsonb_build_object(
	                                        'id', id::varchar(255),
	                                        'thread_id', thread_id::varchar(255),
	                                        'label_ids', labels,
                                            'history_id', history_id::varchar(255),
                                            'internal_date', internal_date::varchar(255) || '000')
                                        )
            INTO _new_draft;
        RETURN _new_draft;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION fedemail.drafts_update_v1(IN _owner character varying, IN _id bigint, IN _payload jsonb)
    RETURNS jsonb AS
    $BODY$
    DECLARE
     _updated_draft jsonb;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        UPDATE fedemail.message
            SET id = nextval('fedemail.message_id_seq'::regclass),
                payload = _payload->'payload',
                snippet = _payload->>'snippet',
                raw = _payload->>'raw',
                internal_date = extract(epoch from now())
            WHERE owner = _owner AND draft_id = _id
            RETURNING jsonb_build_object('id', draft_id::varchar(255),
                                         'message', jsonb_build_object(
	                                        'id', id::varchar(255),
	                                        'thread_id', thread_id::varchar(255),
	                                        'label_ids', labels,
                                            'history_id', history_id::varchar(255),
                                            'internal_date', internal_date::varchar(255) || '000')
                                        )
            INTO _updated_draft;
        RETURN _updated_draft;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION fedemail.drafts_delete_v1(IN _owner character varying, IN _id bigint)
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
                WHERE owner = _owner AND draft_id = _id RETURNING 1
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

    CREATE SEQUENCE people.history_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;

    CREATE TABLE people.connection (
        id BIGSERIAL PRIMARY KEY,
        owner character varying(255) NOT NULL,
        name JSONB,
        email_addresses JSONB,
        history_id bigint DEFAULT nextval('people.history_id_seq'::regclass) NOT NULL,
        internal_date bigint DEFAULT extract(epoch from now()) NOT NULL,
        search_name tsvector,
        search_email_addresses tsvector
    );

    CREATE INDEX idx_connection_name ON people.connection USING gin (name);
    CREATE INDEX idx_connection_email_addresses ON people.connection USING gin (email_addresses);

    CREATE OR REPLACE FUNCTION people.connection_table_inserted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    begin
        NEW.search_name = to_tsvector(NEW.name);
        NEW.search_email_addresses = to_tsvector(NEW.email_addresses);
        RETURN NEW;	
    END; $$;

    CREATE OR REPLACE FUNCTION people.connection_table_updated() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ 
    begin
        NEW.history_id := nextval('people.history_id_seq'::regclass);
        NEW.search_name = to_tsvector(NEW.name);
        NEW.search_email_addresses = to_tsvector(NEW.email_addresses);
        RETURN NEW; 
    END; $$;

    CREATE TRIGGER people_connection_inserted BEFORE INSERT ON people.connection FOR EACH ROW EXECUTE PROCEDURE people.connection_table_inserted();
    CREATE TRIGGER people_connection_updated BEFORE UPDATE ON people.connection FOR EACH ROW EXECUTE PROCEDURE people.connection_table_updated();

    CREATE OR REPLACE FUNCTION people.contacts_list_v1(IN _owner character varying)
    RETURNS TABLE(people jsonb) AS
    $BODY$
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        RETURN QUERY
            SELECT jsonb_build_object('id', id::varchar(255),
                                    'name', name,
                                    'email_addresses', email_addresses,
                                    'history_id', history_id::varchar(255),
                                    'internal_date', internal_date::varchar(255) || '000')
            FROM people.connection
            WHERE owner = _owner
            ORDER BY history_id DESC;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION people.contacts_create_v1(IN _owner character varying, IN _person jsonb)
    RETURNS jsonb AS
    $BODY$
    DECLARE
     _new_person jsonb;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required.';
        END IF;

        INSERT INTO people.connection(owner, name, email_addresses)
            VALUES (_owner, _person->'name', _person->'email_addresses')
            RETURNING jsonb_build_object('id', id::varchar(255),
                                    'name', name,
                                    'email_addresses', email_addresses,
                                    'history_id', history_id::varchar(255),
                                    'internal_date', internal_date::varchar(255) || '000')
            INTO _new_person;
        RETURN _new_person;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    RAISE INFO 'database schema "people" created';
END
$main$;