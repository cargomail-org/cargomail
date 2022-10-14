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
        "body": {"data": "eyJyb290Ijp7ImNoaWxkcmVuIjpbeyJjaGlsZHJlbiI6W3siZGV0YWlsIjowLCJmb3JtYXQiOjAsIm1vZGUiOiJub3JtYWwiLCJzdHlsZSI6IiIsInRleHQiOiJIaSA6LSkiLCJ0eXBlIjoidGV4dCIsInZlcnNpb24iOjF9XSwiZGlyZWN0aW9uIjoibHRyIiwiZm9ybWF0IjoiIiwiaW5kZW50IjowLCJ0eXBlIjoicGFyYWdyYXBoIiwidmVyc2lvbiI6MX1dLCJkaXJlY3Rpb24iOiJsdHIiLCJmb3JtYXQiOiIiLCJpbmRlbnQiOjAsInR5cGUiOiJyb290IiwidmVyc2lvbiI6MX19", "size": 10},
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
        "body": {"data": "eyJyb290Ijp7ImNoaWxkcmVuIjpbeyJjaGlsZHJlbiI6W3siZGV0YWlsIjowLCJmb3JtYXQiOjAsIm1vZGUiOiJub3JtYWwiLCJzdHlsZSI6IiIsInRleHQiOiJIZWxsbyA6LS0pIiwidHlwZSI6InRleHQiLCJ2ZXJzaW9uIjoxfV0sImRpcmVjdGlvbiI6Imx0ciIsImZvcm1hdCI6IiIsImluZGVudCI6MCwidHlwZSI6InBhcmFncmFwaCIsInZlcnNpb24iOjF9XSwiZGlyZWN0aW9uIjoibHRyIiwiZm9ybWF0IjoiIiwiaW5kZW50IjowLCJ0eXBlIjoicm9vdCIsInZlcnNpb24iOjF9fQ==", "size": 10},
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
        "body": {"data": "eyJyb290Ijp7ImNoaWxkcmVuIjpbeyJjaGlsZHJlbiI6W3siZGV0YWlsIjowLCJmb3JtYXQiOjAsIm1vZGUiOiJub3JtYWwiLCJzdHlsZSI6IiIsInRleHQiOiJIaSBNYXR0LCIsInR5cGUiOiJ0ZXh0IiwidmVyc2lvbiI6MX1dLCJkaXJlY3Rpb24iOiJsdHIiLCJmb3JtYXQiOiIiLCJpbmRlbnQiOjAsInR5cGUiOiJwYXJhZ3JhcGgiLCJ2ZXJzaW9uIjoxfSx7ImNoaWxkcmVuIjpbXSwiZGlyZWN0aW9uIjpudWxsLCJmb3JtYXQiOiIiLCJpbmRlbnQiOjAsInR5cGUiOiJwYXJhZ3JhcGgiLCJ2ZXJzaW9uIjoxfSx7ImNoaWxkcmVuIjpbeyJkZXRhaWwiOjAsImZvcm1hdCI6MCwibW9kZSI6Im5vcm1hbCIsInN0eWxlIjoiIiwidGV4dCI6IkknbGwgY29tZSB0byB2aXNpdCB5b3UgbmV4dCB3ZWVrLiIsInR5cGUiOiJ0ZXh0IiwidmVyc2lvbiI6MX1dLCJkaXJlY3Rpb24iOiJsdHIiLCJmb3JtYXQiOiIiLCJpbmRlbnQiOjAsInR5cGUiOiJwYXJhZ3JhcGgiLCJ2ZXJzaW9uIjoxfSx7ImNoaWxkcmVuIjpbXSwiZGlyZWN0aW9uIjoibHRyIiwiZm9ybWF0IjoiIiwiaW5kZW50IjowLCJ0eXBlIjoicGFyYWdyYXBoIiwidmVyc2lvbiI6MX0seyJjaGlsZHJlbiI6W3siZGV0YWlsIjowLCJmb3JtYXQiOjAsIm1vZGUiOiJub3JtYWwiLCJzdHlsZSI6IiIsInRleHQiOiJSZWdhcmRzIiwidHlwZSI6InRleHQiLCJ2ZXJzaW9uIjoxfV0sImRpcmVjdGlvbiI6Imx0ciIsImZvcm1hdCI6IiIsImluZGVudCI6MCwidHlwZSI6InBhcmFncmFwaCIsInZlcnNpb24iOjF9LHsiY2hpbGRyZW4iOlt7ImRldGFpbCI6MCwiZm9ybWF0IjowLCJtb2RlIjoibm9ybWFsIiwic3R5bGUiOiIiLCJ0ZXh0IjoiQW5uZSIsInR5cGUiOiJ0ZXh0IiwidmVyc2lvbiI6MX1dLCJkaXJlY3Rpb24iOiJsdHIiLCJmb3JtYXQiOiIiLCJpbmRlbnQiOjAsInR5cGUiOiJwYXJhZ3JhcGgiLCJ2ZXJzaW9uIjoxfV0sImRpcmVjdGlvbiI6Imx0ciIsImZvcm1hdCI6IiIsImluZGVudCI6MCwidHlwZSI6InJvb3QiLCJ2ZXJzaW9uIjoxfX0=", "size": 1096},
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