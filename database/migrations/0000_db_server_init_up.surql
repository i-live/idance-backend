-- migrations/0000_namespace_database.surql
-- Foundation: Basic Setup for Cloud SurrealDB
-- This migration establishes the basic structure for the iDance application
-- Must be run first before any other migrations

-- ########################################################
-- Basic Setup for Cloud SurrealDB
-- ########################################################

-- Note: For cloud SurrealDB instances, namespace and database are pre-configured
-- We just need to ensure we're using the correct namespace and database
USE NAMESPACE ${SURREALDB_NAMESPACE};
USE DATABASE ${SURREALDB_DATABASE};

-- Basic health check - create a simple table to verify connection
DEFINE TABLE health_check SCHEMAFULL;
DEFINE FIELD created_at ON TABLE health_check TYPE datetime DEFAULT time::now();

-- Insert a test record to verify everything is working
CREATE health_check SET created_at = time::now();