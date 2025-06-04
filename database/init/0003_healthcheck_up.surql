-- Foundation: Basic Setup for Cloud SurrealDB
-- This migration establishes the basic structure for the iDance application
-- Must be run first before any other migrations

-- Use IF NOT EXIST clauses to make operations idempotent
USE NAMESPACE ${SURREALDB_NAMESPACE};
USE DATABASE ${SURREALDB_DATABASE};

-- Basic health check setup
DEFINE TABLE IF NOT EXISTS health_check SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS created_at ON TABLE health_check TYPE datetime DEFAULT time::now();

-- Only insert if no records exist
LET $exists = (SELECT VALUE count() FROM health_check)[0];
IF $exists == 0 THEN
    CREATE health_check SET created_at = time::now();
END;