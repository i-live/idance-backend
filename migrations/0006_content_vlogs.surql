-- migrations/0006_content_vlogs.surql
-- Content & Vlogs: User-Generated Content and Media
-- This migration creates tables for vlogs, posts, and content interactions
-- Requires: 0003_core_users.surql

-- ########################################################
-- Vlog and Content Tables
-- ########################################################

-- Vlogs
-- User-generated content (posts, stories)
DEFINE TABLE vlog SCHEMALESS
    PERMISSIONS
        FOR select WHERE author.user_status = 'active' AND (is_public = true OR author = $auth.id) OR $access = 'backend_worker'
        FOR create WHERE author = $auth.id OR $access = 'backend_worker'
        FOR update WHERE author = $auth.id OR $access = 'backend_worker'
        FOR delete WHERE author = $auth.id OR $access = 'backend_worker';

DEFINE FIELD author ON vlog TYPE record<user>;
DEFINE FIELD title ON vlog TYPE option<string>;
DEFINE FIELD description ON vlog TYPE option<string>;
DEFINE FIELD content_type ON vlog TYPE string DEFAULT 'video' ASSERT $value IN ['video', 'image', 'text', 'audio'];
DEFINE FIELD media_url ON vlog TYPE option<string>;
DEFINE FIELD thumbnail_url ON vlog TYPE option<string>;
DEFINE FIELD duration ON vlog TYPE option<int>;
DEFINE FIELD tags ON vlog TYPE array DEFAULT [];
DEFINE FIELD is_public ON vlog TYPE bool DEFAULT true;
DEFINE FIELD is_featured ON vlog TYPE bool DEFAULT false;
DEFINE FIELD likes_count ON vlog TYPE int DEFAULT 0;
DEFINE FIELD comments_count ON vlog TYPE int DEFAULT 0;
DEFINE FIELD views_count ON vlog TYPE int DEFAULT 0;
DEFINE FIELD created_at ON vlog TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON vlog TYPE datetime DEFAULT time::now();
DEFINE FIELD deleted_at ON vlog TYPE option<datetime>;

DEFINE INDEX vlog_author ON vlog FIELDS author;
DEFINE INDEX vlog_public ON vlog FIELDS is_public, created_at;
DEFINE INDEX vlog_featured ON vlog FIELDS is_featured, created_at;
DEFINE INDEX vlog_tags ON vlog FIELDS tags;
DEFINE INDEX vlog_created_at ON vlog FIELDS created_at;

-- Vlog Likes
-- Tracks likes on vlogs
DEFINE TABLE vlog_like SCHEMAFULL
    PERMISSIONS
        FOR select WHERE user = $auth.id OR $access = 'backend_worker'
        FOR create, delete WHERE user = $auth.id OR $access = 'backend_worker'
        FOR update WHERE $access = 'backend_worker';

DEFINE FIELD user ON vlog_like TYPE record<user>;
DEFINE FIELD vlog ON vlog_like TYPE record<vlog>;
DEFINE FIELD created_at ON vlog_like TYPE datetime DEFAULT time::now();

DEFINE INDEX vlog_like_user_vlog ON vlog_like FIELDS user, vlog UNIQUE;
DEFINE INDEX vlog_like_vlog ON vlog_like FIELDS vlog;
DEFINE INDEX vlog_like_user ON vlog_like FIELDS user;