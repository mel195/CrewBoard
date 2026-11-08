-- Run once per database as a superuser (Docker Compose runs it automatically).
-- Owner role creates tables and policies (migrations); the app role is subject to row-level security.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crewboard') THEN CREATE ROLE crewboard LOGIN PASSWORD 'crewboard'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crewboard_app') THEN CREATE ROLE crewboard_app LOGIN PASSWORD 'crewboard_app'; END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT CREATE, CONNECT ON DATABASE crewboard TO crewboard;
GRANT CONNECT ON DATABASE crewboard TO crewboard_app;
ALTER SCHEMA public OWNER TO crewboard;
