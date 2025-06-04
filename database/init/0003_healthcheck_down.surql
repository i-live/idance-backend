-- migrations/0000_db_server_init_down.surql
-- Server Teardown: Remove namespace and all databases
-- WARNING: This will destroy ALL data in the namespace!

-- ########################################################
-- Database Server Teardown
-- ########################################################

-- Use the namespace first
USE NAMESPACE ${SURREALDB_NAMESPACE};
USE DATABASE ${SURREALDB_DATABASE};

REMOVE TABLE health_check;