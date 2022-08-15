-- replace %[1]s with the user
-- replace %[2]s with the password
-- replace %[3]s with the database name
do $$
DECLARE 
BEGIN
    CREATE EXTENSION IF NOT EXISTS dblink;
    IF NOT EXISTS (SELECT usename FROM pg_catalog.pg_user where usename = '%[1]s') THEN
        CREATE ROLE "%[1]s" NOSUPERUSER CREATEDB NOCREATEROLE NOINHERIT LOGIN NOREPLICATION NOBYPASSRLS PASSWORD '%[2]s';
        
        PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE ' || '%[3]s');

        GRANT ALL ON DATABASE "%[3]s" TO "%[1]s";
    END IF;
END
$$;