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
        "mime_type": "application/json",
        "body": {"data": {"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hi :-)","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}, "size": 10},
        "headers": [
            {"name": "From", "value": "Matthew Cuthbert <matthew.cuthbert@demo.localhost>"},
            {"name": "To", "value": ",,diana.barry@demo.localhost,,,diana.barry@demo.localhost,gilbert.blythe@demo.localhost.org"},
            {"name": "Subject", "value": "Hi there!"},
            {"name": "Message-ID", "value": "1001@demo.localhost"},
            {"name": "Content-Type", "value": "application/json"}
        ]
        }',
        '["SENT"]',
        extract(epoch from now() at time zone 'utc')-86400),
        ('matthew.cuthbert@demo.localhost',
        thread_1,
        'Hello :--)',
        '{
        "mime_type": "application/json",
        "body": {"data": {"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello :--)","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}, "size": 10},
        "headers": [
            {"name": "From", "value": "Diana Barry <diana.barry@demo.localhost>"},
            {"name": "To", "value": "matthew.cuthbert@demo.localhost"},
            {"name": "Subject", "value": "Re: Hi there!"},
            {"name": "Message-ID", "value": "1002@demo.localhost"},
            {"name": "In-Reply-To", "value": "1001@demo.localhost"},
            {"name": "References", "value": "1001@demo.localhost"},
            {"name": "Content-Type", "value": "application/json"}
        ]
        }',
        '["CATEGORY_SOCIAL", "UNREAD", "INBOX"]',
        extract(epoch from now() at time zone 'utc')-1800);
        
        INSERT INTO fedemail.message (owner, thread_id, snippet, payload, labels) VALUES 
        ('matthew.cuthbert@demo.localhost',
        thread_2,
        'Hi Matt, I''ll come to visit you next week. Regards Anne',
        '{
        "mime_type": "application/json",
        "body": {"data": {"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hi Matt,","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"I''ll come to visit you next week.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Regards","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Anne","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}, "size": 1096},
        "headers": [
            {"name": "From", "value": "Anne Shirley <anne.shirley@demo.localhost>"},
            {"name": "To", "value": "matthew.cuthbert@demo.localhost"},
            {"name": "Subject", "value": "Meeting"},
            {"name": "Message-ID", "value": "1003@demo.localhost"},
            {"name": "Content-Type", "value": "application/json"}
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