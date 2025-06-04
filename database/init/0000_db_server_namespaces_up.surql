-- Foundation: Basic Setup for Cloud SurrealDB
-- This migration establishes the basic structure for the iDance application
-- Must be run first before any other migrations

-- Use IF NOT EXIST clauses to make operations idempotent
DEFINE NAMESPACE IF NOT EXISTS ${SURREALDB_NAMESPACE};
USE NAMESPACE ${SURREALDB_NAMESPACE};
