-- %[1]s user
-- %[2]s password
-- %[3]s database name
do $do$
DECLARE 
BEGIN
    CREATE EXTENSION IF NOT EXISTS dblink;
    IF NOT EXISTS (SELECT usename FROM pg_catalog.pg_user where usename = '%[1]s') THEN
        CREATE ROLE "%[1]s" NOSUPERUSER CREATEDB NOCREATEROLE NOINHERIT LOGIN NOREPLICATION NOBYPASSRLS PASSWORD '%[2]s';
        
        IF EXISTS (SELECT 1 FROM pg_database WHERE datname = '%[3]s') THEN
            RAISE WARNING 'database already exists'; 
        ELSE
            PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE ' || '%[3]s');
        END IF;

        GRANT ALL ON DATABASE "%[3]s" TO "%[1]s";
    END IF;
END
$do$;