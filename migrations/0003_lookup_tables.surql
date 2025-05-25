-- migrations/0003_lookup_tables.surql
-- Lookup Tables: Reference Data for Locations, Dance Styles, and Interests
-- This migration creates all the reference/lookup tables used throughout the application
-- Requires: 0001_namespace_database.surql

-- ########################################################
-- Location Lookup Tables
-- ########################################################

-- Country Table
-- Referenced by profile.location.country
DEFINE TABLE country SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $access = 'worker';

DEFINE FIELD name ON country TYPE string;
DEFINE FIELD code ON country TYPE string;
DEFINE FIELD created_at ON country TYPE datetime DEFAULT time::now();

DEFINE INDEX country_code ON country FIELDS code UNIQUE;
DEFINE INDEX country_name ON country FIELDS name;

-- State Table
-- Referenced by profile.location.state
DEFINE TABLE state SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $access = 'worker';

DEFINE FIELD name ON state TYPE string;
DEFINE FIELD code ON state TYPE string;
DEFINE FIELD country ON state TYPE record<country>;
DEFINE FIELD created_at ON state TYPE datetime DEFAULT time::now();

DEFINE INDEX state_code_country ON state FIELDS code, country UNIQUE;
DEFINE INDEX state_country ON state FIELDS country;

-- County Table
-- Referenced by profile.location.county
DEFINE TABLE county SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $access = 'worker';

DEFINE FIELD name ON county TYPE string;
DEFINE FIELD state ON county TYPE record<state>;
DEFINE FIELD created_at ON county TYPE datetime DEFAULT time::now();

DEFINE INDEX county_name_state ON county FIELDS name, state UNIQUE;
DEFINE INDEX county_state ON county FIELDS state;

-- City Table
-- Referenced by profile.location.city
DEFINE TABLE city SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $access = 'worker';

DEFINE FIELD name ON city TYPE string;
DEFINE FIELD county ON city TYPE option<record<county>>;
DEFINE FIELD state ON city TYPE record<state>;
DEFINE FIELD coordinates ON city TYPE option<geometry<point>>;
DEFINE FIELD population ON city TYPE option<int>;
DEFINE FIELD created_at ON city TYPE datetime DEFAULT time::now();

DEFINE INDEX city_name_state ON city FIELDS name, state UNIQUE;
DEFINE INDEX city_state ON city FIELDS state;
DEFINE INDEX city_coordinates ON city FIELDS coordinates MTREE DIMENSION 2;

-- ########################################################
-- Dance and Interest Lookup Tables
-- ########################################################

-- Dance Style Table
-- Referenced by user_dance_style
DEFINE TABLE dance_style SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $access = 'worker';

DEFINE FIELD name ON dance_style TYPE string;
DEFINE FIELD description ON dance_style TYPE option<string>;
DEFINE FIELD category ON dance_style TYPE option<string>;
DEFINE FIELD created_at ON dance_style TYPE datetime DEFAULT time::now();

DEFINE INDEX dance_style_name ON dance_style FIELDS name UNIQUE;
DEFINE INDEX dance_style_category ON dance_style FIELDS category;

-- Interest Table
-- Referenced by user_interest
DEFINE TABLE interest SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $access = 'worker';

DEFINE FIELD name ON interest TYPE string;
DEFINE FIELD description ON interest TYPE option<string>;
DEFINE FIELD category ON interest TYPE option<string>;
DEFINE FIELD created_at ON interest TYPE datetime DEFAULT time::now();

DEFINE INDEX interest_name ON interest FIELDS name UNIQUE;
DEFINE INDEX interest_category ON interest FIELDS category;

-- Social Platform Table
-- Referenced by profile.social_links
DEFINE TABLE social_platform SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $access = 'worker';

DEFINE FIELD name ON social_platform TYPE string;
DEFINE FIELD base_url ON social_platform TYPE string;
DEFINE FIELD icon_url ON social_platform TYPE option<string>;
DEFINE FIELD created_at ON social_platform TYPE datetime DEFAULT time::now();

DEFINE INDEX social_platform_name ON social_platform FIELDS name UNIQUE;