do $main$
DECLARE 
BEGIN
    -- Labels
    do $$
    BEGIN
        INSERT INTO fedemail.label (owner, name, type, payload) VALUES 
        ('matthew.cuthbert@demo.localhost',
        'CHAT',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'INBOX',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'SENT',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'DRAFT',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 0
        }'),
        ('matthew.cuthbert@demo.localhost',
        'TRASH',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'IMPORTANT',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'SPAM',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 0
        }'),
        ('matthew.cuthbert@demo.localhost',
        'CATEGORY_FORUMS',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'CATEGORY_UPDATES',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'CATEGORY_PERSONAL',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'CATEGORY_PROMOTIONS',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'CATEGORY_SOCIAL',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'STARRED',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 1
        }'),
        ('matthew.cuthbert@demo.localhost',
        'UNREAD',
        0,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 0
        }'),
        ('matthew.cuthbert@demo.localhost',
        'Invoices',
        1,
        '{
        "messageListVisibility": 0,
        "labelListVisibility": 0
        }');
    END
    $$;

    -- Attachments
    do $$
    BEGIN
        INSERT INTO fedemail.attachment (owner, filename, content_type, content_uri, payload) VALUES 
        ('matthew.cuthbert@demo.localhost',
        'Test_text.txt',
        'text/plain',
        'file:/50811c73-4bf6-47a0-94ce-3f07f9583786',
        NULL),
        ('matthew.cuthbert@demo.localhost',
        'Fedemail concept.pdf',
        'application/pdf',
        'file:/867cc2b4-ba54-4d19-bae4-e608e57114f2',
        NULL);
    END
    $$;

    -- Messages
    do $$
    DECLARE 
        thread_1 bigint;
        thread_2 bigint;
    BEGIN   
        thread_1 = nextval('fedemail.thread_id_seq'); 
        thread_2 = nextval('fedemail.thread_id_seq'); 

        INSERT INTO fedemail.message (owner, thread_id, snippet, payload, labels, internal_date) VALUES 
        ('matthew.cuthbert@demo.localhost',
        thread_1,
        'Hi :-)',
        '{
        "mime_type": "multipart/mixed",
        "body": {"size": 0},
        "headers": [
            {"name": "From", "value": "Matthew Cuthbert <matthew.cuthbert@demo.localhost>"},
            {"name": "To", "value": ",,diana.barry@demo.localhost,,,diana.barry@demo.localhost,gilbert.blythe@demo.localhost.org"},
            {"name": "Subject", "value": "Hi there!"},
            {"name": "Message-ID", "value": "1001@demo.localhost"},
            {"name": "Content-Type", "value": "multipart/mixed; boundary=\"0000000000000da85a05ea7315ff\""}
        ],
        "parts": [
            {
            "part_id": "0",
            "mime_type": "text/plain",
            "body": {"data": "SGkgOi0p", "size": 6},
            "headers": [
                {"name": "Content-Type", "value": "text/plain"}
            ]
            },
            {
            "part_id": "1",
            "mime_type": "message/external-body",
            "access_type": "URL",
            "expiration": "Mon, 26 June 2023 09:00:00 GMT",
            "url": "http://localhost:9998/api/storage/50811c73-4bf6-47a0-94ce-3f07f9583786",
            "size": 32,
            "external_body" : {
                "mime_type": "text/plain",
                "filename": "plain_text.txt",
                "headers": [
                    {"name": "Content-Type", "value": "text/plain; name=\"plain_text.txt\"; charset=\"us-ascii\""},
                    {"name": "Content-Disposition", "value": "attachment; filename=\"plain_text.txt\""},
                    {"name": "Content-ID", "value": "<50811c73-4bf6-47a0-94ce-3f07f9583786>"}
                    ]
                },
            "headers": [
                {"name": "Content-Type", "value": "message/external-body; access-type=\"URL\"; expiration=\"Mon, 26 June 2023 09:00:00 GMT\"; URL=\"http://localhost:9998/api/storage/50811c73-4bf6-47a0-94ce-3f07f9583786\"; size=32"}
            ]
            },
            {
            "part_id": "2",
            "mime_type": "message/external-body",
            "access_type": "URL",
            "expiration": "Mon, 26 June 2023 09:00:30 GMT",
            "url": "http://localhost:9998/api/storage/867cc2b4-ba54-4d19-bae4-e608e57114f2",
            "size": 55894,
            "external_body": {
                "mime_type": "application/pdf",
                "filename": "Fedemail concept.pdf",
                "headers": [
                    {"name": "Content-Type", "value": "application/pdf; name=\"Fedemail concept.pdf\""},
                    {"name": "Content-Disposition", "value": "attachment; filename=\"Fedemail concept.pdf\""},
                    {"name": "Content-ID", "value": "<867cc2b4-ba54-4d19-bae4-e608e57114f2>"}
                ]
            },
            "headers": [
                {"name": "Content-Type", "value": "message/external-body; access-type=\"URL\"; expiration=\"Mon, 26 June 2023 09:00:30 GMT\"; URL=\"http://localhost:9998/api/storage/867cc2b4-ba54-4d19-bae4-e608e57114f2\"; size=55894"}
            ]
            }
        ]
        }',
        '["SENT"]',
        extract(epoch from now() at time zone 'utc')-86400),
        ('matthew.cuthbert@demo.localhost',
        thread_1,
        'Hello :--)',
        '{
        "mime_type": "text/plain",
        "body": {"data": "SGVsbG8gOi0tKQ==", "size": 10},
        "headers": [
            {"name": "From", "value": "Diana Barry <diana.barry@demo.localhost>"},
            {"name": "To", "value": "matthew.cuthbert@demo.localhost"},
            {"name": "Subject", "value": "Re: Hi there!"},
            {"name": "Message-ID", "value": "1002@demo.localhost"},
            {"name": "In-Reply-To", "value": "1001@demo.localhost"},
            {"name": "References", "value": "1001@demo.localhost"},
            {"name": "Content-Type", "value": "text/plain"}
        ]
        }',
        '["CATEGORY_SOCIAL", "UNREAD", "INBOX"]',
        extract(epoch from now() at time zone 'utc')-1800);
        
        INSERT INTO fedemail.message (owner, thread_id, snippet, payload, labels) VALUES 
        ('matthew.cuthbert@demo.localhost',
        thread_2,
        'Have a nice day :)',
        '{
        "mime_type": "text/plain",
        "body": {"data": "SGF2ZSBhIG5pY2UgZGF5IDop", "size": 18},
        "headers": [
            {"name": "From", "value": "Anne Shirley <anne.shirley@demo.localhost>"},
            {"name": "To", "value": "matthew.cuthbert@demo.localhost"},
            {"name": "Subject", "value": "Hello from Anna!"},
            {"name": "Message-ID", "value": "1003@demo.localhost"},
            {"name": "Content-Type", "value": "text/plain"}
        ]
        }',
        '["CATEGORY_SOCIAL", "UNREAD", "INBOX"]');
    END
    $$;

    RAISE INFO 'data inserted into federizer/fedemail';

    -- Contacts
    do $$
    BEGIN
        INSERT INTO people.connection (owner, name, email_addresses) VALUES 
        ('matthew.cuthbert@demo.localhost',
        '{
            "display_name": "Anne Shirley",
            "family_name": "Shirley",
            "given_name": "Anne"
        }',
        '[
            {
                "value": "anne.shirley@demo.localhost",
                "type": "home"
            }
        ]'),
        ('matthew.cuthbert@demo.localhost',
        '{
            "display_name": "Gilbert Blythe",
            "family_name": "Blythe",
            "given_name": "Gilbert"
        }',
        '[
            {
                "value": "gilbert.blythe@demo.localhost",
                "type": "home"
            }
        ]'),
        ('matthew.cuthbert@demo.localhost',
        '{
            "display_name": "Diana Barry",
            "family_name": "Barry",
            "given_name": "Diana"
        }',
        '[
            {
                "value": "diana.barry@demo.localhost",
                "type": "home"
            }
        ]');
    END
    $$;

    RAISE INFO 'data inserted into federizer/people';
END
$main$;