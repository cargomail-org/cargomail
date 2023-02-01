do $main$
DECLARE 
BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

----------------------------------------------------email---------------------------------------------------------------

    IF EXISTS (SELECT DISTINCT table_schema FROM information_schema.tables WHERE table_schema = 'email') THEN
        RAISE WARNING 'database schema "email" already exists -> drop & create';
        DROP SCHEMA email CASCADE;
    END IF;

    CREATE SCHEMA email;

    CREATE SEQUENCE email.history_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;      

    CREATE SEQUENCE email.thread_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;

    CREATE SEQUENCE email.draft_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;

    CREATE SEQUENCE email.message_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1; 

    CREATE TABLE email.label (
        id BIGSERIAL PRIMARY KEY,
        owner character varying(255) NOT NULL,
        name character varying(255) NOT NULL,
        type int NOT NULL DEFAULT 0,
        payload JSONB
    );	

    CREATE TABLE email.message (
        id bigint DEFAULT nextval('email.message_id_seq'::regclass) PRIMARY KEY,
        owner character varying(255) NOT NULL,
        thread_id bigint DEFAULT nextval('email.thread_id_seq'::regclass) NOT NULL,
        draft_id bigint,
        snippet character varying(255),
        raw TEXT,
        payload JSONB,
        labels JSONB,
        history_id bigint DEFAULT nextval('email.history_id_seq'::regclass) NOT NULL,
        internal_date bigint DEFAULT extract(epoch from now()) NOT NULL,
        search_subject tsvector,
        search_from tsvector,
        search_recipients tsvector
    );

    CREATE UNIQUE INDEX idx_message_draft_id ON email.message(draft_id);

    -- CREATE INDEX idx_message_payload_message_id ON email.message USING gin ((payload->'Message-ID'));
    -- CREATE INDEX idx_message_payload_in_reply_to ON email.message USING gin ((payload->'In-Reply-To'));
    -- CREATE INDEX idx_message_payload_references ON email.message USING gin ((payload->'References'));
    -- CREATE INDEX idx_message_payload_subject ON email.message USING gin ((payload->'Subject'));
    -- CREATE INDEX idx_message_payload_from ON email.message USING gin ((payload->'From'));
    -- CREATE INDEX idx_message_payload_recipients_to ON email.message USING gin ((payload->'Recipients'->'To'));
    -- CREATE INDEX idx_message_payload_recipients_cc ON email.message USING gin ((payload->'Recipients'->'Cc'));
    -- CREATE INDEX idx_message_payload_recipients_bcc ON email.message USING gin ((payload->'Recipients'->'Bcc'));

    -- CREATE INDEX idx_message_labels ON email.message USING gin (labels);

    CREATE OR REPLACE FUNCTION email.message_table_inserted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    begin
        -- -- NEW.payload['Message_ID'] = to_jsonb(public.gen_random_uuid()::text);
        -- NEW.search_subject = to_tsvector(NEW.payload['Subject']);
        -- NEW.search_from = to_tsvector(NEW.payload['From']);
        -- NEW.search_recipients = to_tsvector(NEW.payload['Recipients']);
        RETURN NEW;	
    END; $$;

    CREATE OR REPLACE FUNCTION email.message_table_updated() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ 
    begin
        if (NEW.payload <> OLD.payload) then
            NEW.history_id := nextval('email.history_id_seq'::regclass);
        end if;
        RETURN NEW; 
    END; $$;

    CREATE TRIGGER message_inserted BEFORE INSERT ON email.message FOR EACH ROW EXECUTE PROCEDURE email.message_table_inserted();
    CREATE TRIGGER message_updated BEFORE UPDATE ON email.message FOR EACH ROW EXECUTE PROCEDURE email.message_table_updated();

    CREATE OR REPLACE FUNCTION email.labels_list_v1(IN _owner character varying)
    RETURNS TABLE(label jsonb) AS
    $BODY$
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
        END IF;

        RETURN QUERY
            SELECT jsonb_build_object('id', CASE WHEN (type = 0) THEN name ELSE CONCAT('Label_', id::varchar(255)) END,
                                    'name', name,
                                    'message_list_visibility', payload['messageListVisibility'],
                                    'label_list_visibility', payload['labelListVisibility'],
                                    'type', type) FROM email.label
                WHERE owner = _owner;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION email.threads_list_v1(IN _owner character varying)
    RETURNS TABLE(thread jsonb) AS
    $BODY$
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
        END IF;

        RETURN QUERY
        	WITH results AS (
	            SELECT DISTINCT
	                (SELECT jsonb_build_object('id', detail.thread_id::varchar(255),
	                                        'snippet', detail.snippet,
	                                        'history_id', detail.history_id::varchar(255),
	                                        'internal_date', detail.internal_date::varchar(255) || '000') FROM email.message detail
	                WHERE thread_id = master.thread_id 
	                ORDER BY internal_date DESC LIMIT 1) AS thread
	            FROM email.message AS master
	            WHERE owner = _owner
	        ) SELECT results.thread FROM results
	          ORDER BY results.thread->>'internal_date' DESC;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION email.threads_get_v1(IN _owner character varying, IN _thread_id bigint)
    RETURNS TABLE(thread jsonb) AS
    $BODY$
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
        END IF;

        RETURN QUERY
        SELECT jsonb_build_object('id', id::varchar(255),
                                        'thread_id', thread_id::varchar(255),
                                        'snippet', snippet,
                                        'payload', payload,
                                        'label_ids', labels,
                                        'history_id', history_id::varchar(255),
                                        'internal_date', internal_date::varchar(255) || '000') FROM email.message
                WHERE owner = _owner AND thread_id = _thread_id 
                ORDER BY internal_date ASC;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION email.drafts_list_v1(IN _owner character varying)
    RETURNS TABLE(draft jsonb) AS
    $BODY$
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
        END IF;

        RETURN QUERY
            SELECT jsonb_build_object('id', draft_id::varchar(255),
                                    'message', jsonb_build_object(
                                        'id', id::varchar(255),
                                        'thread_id', thread_id::varchar(255))
                                    ) FROM email.message                                   
                WHERE owner = _owner AND draft_id IS NOT NULL
                ORDER BY history_id DESC;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION email.drafts_get_v1(IN _owner character varying, IN _id bigint)
    RETURNS jsonb AS
    $BODY$
    DECLARE
      _draft jsonb;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
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
                                    ) FROM email.message
                WHERE owner = _owner AND draft_id = _id
                INTO _draft;
		RETURN _draft;                   
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION email.drafts_create_v1(IN _owner character varying, IN _message jsonb)
    RETURNS jsonb AS
    $BODY$
    DECLARE
     _labels jsonb;
     _new_draft jsonb;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
        END IF;

        _labels = to_jsonb('["DRAFT"]'::json);

        INSERT INTO email.message(owner, draft_id, payload, labels)
            VALUES (_owner, nextval('email.draft_id_seq'::regclass), _message->'payload', _labels)
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

    CREATE OR REPLACE FUNCTION email.drafts_update_v1(IN _owner character varying, IN _id bigint, IN _message jsonb)
    RETURNS jsonb AS
    $BODY$
    DECLARE
     _updated_draft jsonb;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
        END IF;

        UPDATE email.message
            SET id = nextval('email.message_id_seq'::regclass),
                payload = _message->'payload',
                snippet = _message->>'snippet',
                raw = _message->>'raw',
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

    CREATE OR REPLACE FUNCTION email.drafts_delete_v1(IN _owner character varying, IN _id bigint)
    RETURNS bigint AS
    $BODY$
    DECLARE
        _removed_cnt bigint = 0;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
        END IF;

        WITH affected_rows AS (
            DELETE FROM email.message
                WHERE owner = _owner AND draft_id = _id RETURNING 1
        ) SELECT COUNT(*) INTO _removed_cnt
            FROM affected_rows;		
        RETURN _removed_cnt;			
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    RAISE INFO 'database schema "email" created';

    CREATE OR REPLACE FUNCTION email.attachments_set(_payload jsonb, IN _uploadId character varying, IN _file jsonb)
    RETURNS jsonb AS
    $BODY$
    DECLARE
	    _rec RECORD;
	    _download_url_path TEXT[];
	    _filename_path TEXT[];
	    _mime_type_path TEXT[];
	    _file_size_path TEXT[];
	    _sha256sum_path TEXT[];
    BEGIN
        -- RAISE INFO '_file: %'\n, _file;
        -- RAISE INFO '_payload: %\n', _payload;

        FOR _rec IN SELECT * FROM email.jsonb_paths(_payload, '{}') path WHERE path @> '{"uploadId"}'
        LOOP
            IF ((_payload #>> _rec.path)::text = _uploadId) THEN
                _download_url_path = email.array_set(_rec.path, array_length(_rec.path, 1), 'downloadUrl');
                _filename_path = email.array_set(_rec.path, array_length(_rec.path, 1), 'filename');
                _mime_type_path = email.array_set(_rec.path, array_length(_rec.path, 1), 'mimeType');
                _file_size_path = email.array_set(_rec.path, array_length(_rec.path, 1), 'fileSize');
                _sha256sum_path = email.array_set(_rec.path, array_length(_rec.path, 1), 'sha256sum');
                _payload := jsonb_set(_payload, _rec.path, '""');
                _payload := jsonb_set(_payload, _download_url_path, _file->'download_url');
                _payload := jsonb_set(_payload, _filename_path, _file->'filename');
                _payload := jsonb_set(_payload, _mime_type_path, _file->'mime_type');
                _payload := jsonb_set(_payload, _file_size_path, _file->'file_size');
                _payload := jsonb_set(_payload, _sha256sum_path, _file->'sha256sum');
            END IF;
        END LOOP;

        RETURN _payload;
    END;
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    -- https://dba.stackexchange.com/questions/268102/postgres-update-a-value-in-a-array-on-particular-index
    CREATE OR REPLACE FUNCTION email.array_set(_input ANYARRAY, _index INT, _new_value ANYELEMENT)
    RETURNS anyarray AS
    $BODY$
    BEGIN
        IF _input IS NOT NULL THEN
            _input[_index] := _new_value;
        END IF;
        RETURN _input;
    END;
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    -- https://stackoverflow.com/questions/46797443/how-to-use-postgresql-jsonb-set-to-create-new-deep-object-element
    CREATE OR REPLACE FUNCTION email.jsonb_deep_set(curjson jsonb, globalpath text[], newval jsonb)
    RETURNS jsonb AS
    $BODY$
    BEGIN
        IF curjson is null THEN
        curjson := '{}'::jsonb;
        END IF;
        FOR index IN 1..ARRAY_LENGTH(globalpath, 1) LOOP
        IF curjson #> globalpath[1:index] is null THEN
            curjson := jsonb_set(curjson, globalpath[1:index], '{}');
        END IF;
        END LOOP;
        curjson := jsonb_set(curjson, globalpath, newval);
        RETURN curjson;
    END;
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    -- https://dba.stackexchange.com/questions/303985/how-to-obtain-the-path-to-the-match-of-a-jsonpath-query-in-postgresql-14
    CREATE OR REPLACE FUNCTION email.jsonb_paths(data jsonb, prefix text[])
    RETURNS SETOF text[] AS
    $BODY$
    DECLARE
        key text;
        value jsonb;
        counter integer := 0;
    BEGIN
        IF jsonb_typeof(data) = 'object' THEN
            FOR key, value IN
                SELECT * FROM jsonb_each(data)
            LOOP
                IF jsonb_typeof(value) IN ('array', 'object') THEN
                    RETURN QUERY SELECT * FROM email.jsonb_paths(value, array_append(prefix, key));
                ELSE
                    RETURN NEXT array_append(prefix, key);
                END IF;
            END LOOP;
        ELSIF jsonb_typeof(data) = 'array' THEN
            FOR value IN
                SELECT * FROM jsonb_array_elements(data)
            LOOP
                IF jsonb_typeof(value) IN ('array', 'object') THEN
                    RETURN QUERY SELECT * FROM email.jsonb_paths(value, array_append(prefix, counter::text));
                ELSE
                    RETURN NEXT array_append(prefix, counter::text);
                END IF;
                counter := counter + 1;
            END LOOP;
        END IF;
    END
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION email.drafts_update_attachment_v1(IN _owner character varying, IN _attachment jsonb)
    RETURNS bigint AS
    $BODY$
    DECLARE
        _updated_cnt bigint = 0;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
        END IF;

        RAISE INFO 'uploadId: %', _attachment->>'upload_id';

        WITH affected_rows AS (
            UPDATE email.message
                SET payload = email.attachments_set(payload, _attachment->>'upload_id', _attachment)   
                WHERE owner = _owner AND
                    payload @@ '$.**.type == "attachment"' AND
                    payload @@ format('$.**.uploadId == "%s"', _attachment->>'upload_id')::jsonpath RETURNING 1
        ) SELECT COUNT(*) INTO _updated_cnt
          FROM affected_rows;		
        RETURN _updated_cnt;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

---------------------------------------------------resources------------------------------------------------------------

    IF EXISTS (SELECT DISTINCT table_schema FROM information_schema.tables WHERE table_schema = 'resources') THEN
        RAISE WARNING 'database schema "resources" already exists -> drop & create';
        DROP SCHEMA resources CASCADE;
    END IF;

    CREATE SCHEMA resources;

    CREATE SEQUENCE resources.file_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;

    CREATE SEQUENCE resources.history_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;     

    CREATE TABLE resources.file (
        id bigint DEFAULT nextval('resources.file_id_seq'::regclass) PRIMARY KEY,
        owner character varying(255) NOT NULL,
        download_url character varying(255) NOT NULL,
        filename character varying(255) NOT NULL,
        mime_type character varying(255) NOT NULL,
        size bigint NOT NULL DEFAULT -1,
        sha256sum character varying(255),
        payload JSONB,
        history_id bigint DEFAULT nextval('resources.history_id_seq'::regclass) NOT NULL,
        internal_date bigint DEFAULT extract(epoch from now()) NOT NULL,
        search_content_type tsvector,
        search_filename tsvector,
        search_content tsvector
    );

    CREATE OR REPLACE FUNCTION resources.file_table_inserted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    begin
        -- -- NEW.payload['Message_ID'] = to_jsonb(public.gen_random_uuid()::text);
        -- NEW.search_subject = to_tsvector(NEW.payload['Subject']);
        -- NEW.search_from = to_tsvector(NEW.payload['From']);
        -- NEW.search_recipients = to_tsvector(NEW.payload['Recipients']);
        RETURN NEW;	
    END; $$;

    CREATE OR REPLACE FUNCTION resources.file_table_updated() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ 
    begin
        if (NEW.payload <> OLD.payload) then
            NEW.history_id := nextval('resources.history_id_seq'::regclass);
        end if;
        RETURN NEW; 
    END; $$;

    CREATE TRIGGER file_inserted BEFORE INSERT ON resources.file FOR EACH ROW EXECUTE PROCEDURE resources.file_table_inserted();
    CREATE TRIGGER file_updated BEFORE UPDATE ON resources.file FOR EACH ROW EXECUTE PROCEDURE resources.file_table_updated();

    CREATE OR REPLACE FUNCTION resources.files_create_v1(IN _owner character varying, IN _file jsonb)
    RETURNS jsonb AS
    $BODY$
    DECLARE
        _new_file jsonb;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
        END IF;

        INSERT INTO resources.file(owner, download_url, filename, mime_type, size, sha256sum)
            VALUES (_owner, _file->>'download_url', _file->>'filename', _file->>'mime_type', NULLIF(_file->>'size', '')::bigint, _file->>'sha256sum')
            RETURNING jsonb_build_object('id', id::varchar(255),
                                         'download_url', download_url::varchar(255),
                                         'filename', filename::varchar(255),
                                         'mime_type', mime_type::varchar(255),
                                         'size', COALESCE(size, -1),
                                         'sha256sum', sha256sum::varchar(255)
                                        )
            INTO _new_file;
        RETURN _new_file;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

    CREATE OR REPLACE FUNCTION resources.files_update_v1(IN _owner character varying, IN _id bigint, IN _uploadId character varying, IN _file jsonb)
    RETURNS jsonb AS
    $BODY$
    DECLARE
        _updated_file jsonb;
    BEGIN
        -- _owner is required
        IF coalesce(TRIM(_owner), '') = '' THEN
            RAISE EXCEPTION '_owner is required';
        END IF;

        -- _uploadId is required
        IF coalesce(TRIM(_uploadId), '') = '' THEN
            RAISE EXCEPTION '_uploadId is required';
        END IF;

        -- RAISE INFO 'uploadId: %', _uploadId;
        -- RAISE INFO '_file: %', _file;

        UPDATE resources.file
            SET sha256sum = _file->>'sha256sum'
            WHERE owner = _owner AND id = _id
            RETURNING jsonb_build_object('id', id::varchar(255),
                                         'download_url', download_url::varchar(255),
                                         'filename', filename::varchar(255),
                                         'mime_type', mime_type::varchar(255),
                                         'size', COALESCE(size::bigint, -1),
                                         'sha256sum', sha256sum::varchar(255)

                                        )
            INTO _updated_file;

            -- RAISE INFO '_updated_file: %', _updated_file;

            -- UPDATE email.message
			-- SET payload = email.attachments_set(payload, _uploadId, _file)   
			-- WHERE owner = _owner AND
			-- payload @@ '$.**.type == "attachment"' AND
			-- payload @@ format('$.**.uploadId == "%s"', _uploadId)::jsonpath;

        RETURN _updated_file;
    END;			
    $BODY$
    LANGUAGE plpgsql VOLATILE;

----------------------------------------------------people--------------------------------------------------------------

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
            RAISE EXCEPTION '_owner is required';
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
            RAISE EXCEPTION '_owner is required';
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