do $main$
DECLARE 
BEGIN
    -- Labels
    do $$
    BEGIN
        INSERT INTO email.label (owner, name, type, payload) VALUES 
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

    -- Files
    do $$
    BEGIN
        INSERT INTO email.file (owner, transient_uri, sha256sum, filename, mime_type, size, payload) VALUES 
        ('matthew.cuthbert@demo.localhost',
        'http://localhost:8180/files/727940dc3cf0fd3119ea523775ca8c98',
        '77145c94c11f3754207499158df22406e1fe7635553c1c86dc5e881dfeb32016',
        'Big_Buck_Bunny_360_10s_1MB.mp4',
        'video/mp4',
        991017,
        NULL),
        ('matthew.cuthbert@demo.localhost',
        'http://localhost:8180/files/c3deb09eaa257b5480c66145ac869bc3',
        '3df79d34abbca99308e79cb94461c1893582604d68329a41fd4bec1885e6adb4',
        'dummy.pdf',
        'application/pdf',
        13264,
        NULL);
    END
    $$;

    -- Messages
    do $$
    DECLARE 
        thread_1 bigint;
        thread_2 bigint;
    BEGIN   
        thread_1 = nextval('email.thread_id_seq'); 
        thread_2 = nextval('email.thread_id_seq'); 

        INSERT INTO email.message (owner, thread_id, snippet, payload, labels, internal_date) VALUES 
        ('matthew.cuthbert@demo.localhost',
        thread_1,
        'Hi, please see the attachments!',
        '{
        "mime_type": "application/json",
        "body": {"data": {"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "Hi, please see the attachments!", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr"}, {"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"src": "/images/attachment-red.svg", "type": "attachment", "width": 100, "height": 100.09375, "altText": "Yellow flower in tilt shift lens", "caption": {"editorState": {"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "Invoice.pdf", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr"}], "direction": "ltr"}}}, "version": 1, "maxWidth": 444, "showCaption": true}, {"mode": "normal", "text": " ", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}, {"src": "/images/attachment-green.svg", "type": "attachment", "width": 100, "height": 98.59375, "altText": "Yellow flower in tilt shift lens", "caption": {"editorState": {"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "Balance.xls", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr"}], "direction": "ltr"}}}, "version": 1, "maxWidth": 444, "showCaption": true}], "direction": null}, {"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "Regards", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr"}], "direction": "ltr"}}, "size": 1613},
        "headers": [
            {"name": "From", "value": "Matthew Cuthbert <matthew.cuthbert@demo.localhost>"},
            {"name": "To", "value": ",,diana.barry@demo.localhost,,,diana.barry@demo.localhost,gilbert.blythe@demo.localhost.org"},
            {"name": "Subject", "value": "Hi there!"},
            {"name": "Message-ID", "value": "1001@demo.localhost"},
            {"name": "Content-Type", "value": "application/json"},
            {"name": "Content-Transfer-Encoding", "value": "base64"}
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
            {"name": "Content-Type", "value": "application/json"},
            {"name": "Content-Transfer-Encoding", "value": "base64"}
        ]
        }',
        '["CATEGORY_SOCIAL", "UNREAD", "INBOX"]',
        extract(epoch from now() at time zone 'utc')-1800);
        
        INSERT INTO email.message (owner, thread_id, snippet, payload, labels) VALUES 
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
            {"name": "Content-Type", "value": "application/json"},
            {"name": "Content-Transfer-Encoding", "value": "base64"}
        ]
        }',
        '["CATEGORY_SOCIAL", "UNREAD", "INBOX"]');
    END
    $$;

    RAISE INFO 'data inserted into cargomail/email';

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

    RAISE INFO 'data inserted into cargomail/people';
END
$main$;