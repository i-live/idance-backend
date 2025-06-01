-- migrations/0000_namespace_database.surql
-- Foundation: Namespace and Database Setup
-- This migration establishes the basic SurrealDB structure for the iDance application
-- Must be run first before any other migrations

-- ########################################################
-- Namespace and Database Setup
-- ########################################################

-- Define the namespace
DEFINE NAMESPACE ${SURREALDB_NAMESPACE};

-- Use the namespace
USE NAMESPACE ${SURREALDB_NAMESPACE};

-- Define databases for different environments
DEFINE DATABASE dev;
DEFINE DATABASE prod;
DEFINE DATABASE test;

-- Note: The specific database to use should be selected when connecting
-- Example: USE DATABASE dev; (for development environment)
-- Example: USE DATABASE prod; (for production environment)
-- Example: USE DATABASE test; (for testing environment)
USE DATABASE ${SURREALDB_DATABASE};