-- migrations/0004_lookup_tables_down.surql
-- Lookup Tables Teardown: Remove all lookup tables and their indexes

-- Remove city indexes
REMOVE INDEX IF EXISTS city_coordinates ON TABLE city;
REMOVE INDEX IF EXISTS city_state ON TABLE city;
REMOVE INDEX IF EXISTS city_name_state ON TABLE city;

-- Remove county indexes
REMOVE INDEX IF EXISTS county_state ON TABLE county;
REMOVE INDEX IF EXISTS county_name_state ON TABLE county;

-- Remove state indexes
REMOVE INDEX IF EXISTS state_country ON TABLE state;
REMOVE INDEX IF EXISTS state_code_country ON TABLE state;

-- Remove country indexes
REMOVE INDEX IF EXISTS country_name ON TABLE country;
REMOVE INDEX IF EXISTS country_code ON TABLE country;

-- Remove dance style indexes
REMOVE INDEX IF EXISTS dance_style_category ON TABLE dance_style;
REMOVE INDEX IF EXISTS dance_style_name ON TABLE dance_style;

-- Remove interest indexes
REMOVE INDEX IF EXISTS interest_category ON TABLE interest;
REMOVE INDEX IF EXISTS interest_name ON TABLE interest;

-- Remove social platform indexes
REMOVE INDEX IF EXISTS social_platform_name ON TABLE social_platform;

-- Remove tables in correct dependency order
REMOVE TABLE IF EXISTS city;
REMOVE TABLE IF EXISTS county;
REMOVE TABLE IF EXISTS state;
REMOVE TABLE IF EXISTS country;
REMOVE TABLE IF EXISTS dance_style;
REMOVE TABLE IF EXISTS interest;
REMOVE TABLE IF EXISTS social_platform;