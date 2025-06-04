-- Foundation: Basic Setup for Cloud SurrealDB
-- This migration establishes the basic structure for the iDance application
-- Must be run first before any other migrations

-- Use IF NOT EXIST clauses to make operations idempotent


DEFINE DATABASE IF NOT EXISTS dev;
DEFINE DATABASE IF NOT EXISTS prod;
DEFINE DATABASE IF NOT EXISTS test;

DEFINE DATABASE IF NOT EXISTS ${SURREALDB_DATABASE};
USE DATABASE ${SURREALDB_DATABASE};

