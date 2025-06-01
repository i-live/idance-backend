-- migrations/0004_lookup_tables_down.surql
-- Lookup Tables Teardown: Remove reference data tables
-- WARNING: This will remove all lookup data!

-- ########################################################
-- Lookup Tables Teardown
-- ########################################################

-- Remove lookup tables in reverse dependency order
REMOVE TABLE social_platform;
REMOVE TABLE interest;
REMOVE TABLE dance_style;
REMOVE TABLE city;
REMOVE TABLE county;
REMOVE TABLE state;
REMOVE TABLE country;