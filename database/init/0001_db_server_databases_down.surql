-- migrations/0000_db_server_init_down.surql
-- Server Teardown: Remove namespace and all databases
-- WARNING: This will destroy ALL data in the namespace!

-- ########################################################
-- Database Server Teardown
-- ########################################################

-- Remove all databases (this will destroy all data!)
REMOVE DATABASE IF EXISTS dev;
REMOVE DATABASE IF EXISTS prod;
REMOVE DATABASE IF EXISTS test;
