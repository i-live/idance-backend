-- migrations/0002_core_users.surql
-- Core User Tables: User, Profile, and Device Management
-- This migration creates the essential user-related tables
-- Requires: 0000_namespace_database.surql, 0001_authentication.surql

-- ########################################################
-- User Table
-- ########################################################
-- Stores general user data, authentication credentials, and OAuth providers
DEFINE TABLE user SCHEMAFULL
    PERMISSIONS
        -- Users can view their own full record
        FOR select WHERE id = $auth.id FULL
        
        -- Public can view limited fields of active users
        FOR select WHERE user_status = 'active'
            FIELDS id, username, first_name, last_name, profile_picture_url
        
        -- Only allow creation through access methods
        FOR create WHERE $access IN ['user', 'oauth'] FULL
        
        -- Users can update their own record, workers can update any
        FOR update WHERE id = $auth.id OR $access = 'worker' FULL
        
        -- Soft delete only (set deleted_at instead of actual deletion)
        FOR delete WHERE (id = $auth.id OR $access = 'worker') AND deleted_at = NONE
            SET deleted_at = time::now();

-- User table fields
DEFINE FIELD email ON user TYPE string ASSERT string::is::email($value);
DEFINE FIELD password ON user TYPE option<string>;
DEFINE FIELD oauth_providers ON user TYPE array DEFAULT [];
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD first_name ON user TYPE string;
DEFINE FIELD last_name ON user TYPE string;
DEFINE FIELD profile_picture_url ON user TYPE option<string>;
DEFINE FIELD user_status ON user TYPE string DEFAULT 'pending_waitlist_approval' ASSERT $value IN ['pending_waitlist_approval', 'active', 'suspended', 'banned', 'deleted'];
DEFINE FIELD user_tier ON user TYPE string DEFAULT 'basic' ASSERT $value IN ['basic', 'pro', 'vip'];
DEFINE FIELD last_active_at ON user TYPE option<datetime>;
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now();
DEFINE FIELD deleted_at ON user TYPE option<datetime>;

-- User table indexes
DEFINE INDEX user_email ON user FIELDS email UNIQUE;
DEFINE INDEX user_username ON user FIELDS username UNIQUE;
DEFINE INDEX user_status ON user FIELDS user_status;
DEFINE INDEX user_tier ON user FIELDS user_tier;
DEFINE INDEX user_active ON user FIELDS user_status, last_active_at;

-- ########################################################
-- Profile Table
-- ########################################################
-- Stores comprehensive user profile information including physical attributes,
-- location data, preferences, and portfolio items
DEFINE TABLE profile SCHEMAFULL
    PERMISSIONS
        -- Users can view their own full profile
        FOR select WHERE user = $auth.id FULL
        
        -- Public can view profiles of active users with limited fields
        FOR select WHERE user.user_status = 'active'
            FIELDS user, age, height, weight, body_type, ethnicity, hair_color, eye_color, 
                   location, bio, portfolio, social_links, search_preferences
        
        -- Users can create/update their own profile, workers can manage any
        FOR create, update WHERE user = $auth.id OR $access = 'worker' FULL
        
        -- Soft delete only
        FOR delete WHERE (user = $auth.id OR $access = 'worker') AND deleted_at = NONE
            SET deleted_at = time::now();

-- Profile table fields
DEFINE FIELD user ON profile TYPE record<user>;
DEFINE FIELD age ON profile TYPE option<int> ASSERT $value = NONE OR ($value >= 18 AND $value <= 100);
DEFINE FIELD height ON profile TYPE option<int>;
DEFINE FIELD weight ON profile TYPE option<int>;
DEFINE FIELD body_type ON profile TYPE option<string> ASSERT $value = NONE OR $value IN ['slim', 'athletic', 'average', 'curvy', 'plus_size'];
DEFINE FIELD ethnicity ON profile TYPE option<string>;
DEFINE FIELD hair_color ON profile TYPE option<string>;
DEFINE FIELD eye_color ON profile TYPE option<string>;

-- Location fields (granular for geospatial searches)
DEFINE FIELD location ON profile TYPE option<object>;
DEFINE FIELD location.coordinates ON profile TYPE option<geometry<point>>;
DEFINE FIELD location.country ON profile TYPE option<record<country>>;
DEFINE FIELD location.state ON profile TYPE option<record<state>>;
DEFINE FIELD location.county ON profile TYPE option<record<county>>;
DEFINE FIELD location.city ON profile TYPE option<record<city>>;
DEFINE FIELD location.zipcode ON profile TYPE option<string>;
DEFINE FIELD location.street ON profile TYPE option<string>;

-- Profile content
DEFINE FIELD bio ON profile TYPE option<string>;
DEFINE FIELD portfolio ON profile TYPE array DEFAULT [];
DEFINE FIELD social_links ON profile TYPE array DEFAULT [];

-- Search preferences for pro/vip users
DEFINE FIELD search_preferences ON profile TYPE option<object>;
DEFINE FIELD search_preferences.age_range ON profile TYPE option<object>;
DEFINE FIELD search_preferences.age_range.min ON profile TYPE option<int>;
DEFINE FIELD search_preferences.age_range.max ON profile TYPE option<int>;
DEFINE FIELD search_preferences.distance_km ON profile TYPE option<int>;
DEFINE FIELD search_preferences.body_types ON profile TYPE option<array>;
DEFINE FIELD search_preferences.ethnicities ON profile TYPE option<array>;
DEFINE FIELD search_preferences.dance_styles ON profile TYPE option<array>;

-- AI matching fields
DEFINE FIELD vlog_embedding ON profile TYPE option<array<float>>;
DEFINE FIELD lifestyle_tags ON profile TYPE array DEFAULT [];

-- Timestamps
DEFINE FIELD created_at ON profile TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON profile TYPE datetime DEFAULT time::now();
DEFINE FIELD deleted_at ON profile TYPE option<datetime>;

-- Profile table indexes
DEFINE INDEX profile_user ON profile FIELDS user UNIQUE;
DEFINE INDEX profile_location ON profile FIELDS location.coordinates MTREE DIMENSION 2;
DEFINE INDEX profile_age ON profile FIELDS age;
DEFINE INDEX profile_vlog_embedding ON profile FIELDS vlog_embedding HNSW DIMENSION 1536 DISTANCE COSINE EFC 150 M 16;

-- ########################################################
-- Device Table
-- ########################################################
-- Stores device tokens for push notifications
DEFINE TABLE device SCHEMAFULL
    PERMISSIONS
        FOR select, create, update, delete WHERE user = $auth.id OR $access = 'worker';

-- Device table fields
DEFINE FIELD user ON device TYPE record<user>;
DEFINE FIELD device_token ON device TYPE string;
DEFINE FIELD platform ON device TYPE string ASSERT $value IN ['ios', 'android', 'web'];
DEFINE FIELD is_active ON device TYPE bool DEFAULT true;
DEFINE FIELD created_at ON device TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON device TYPE datetime DEFAULT time::now();

-- Device table indexes
DEFINE INDEX device_user ON device FIELDS user;
DEFINE INDEX device_token ON device FIELDS device_token UNIQUE;
DEFINE INDEX device_active ON device FIELDS user, is_active;