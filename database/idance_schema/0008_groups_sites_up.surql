-- migrations/0007_groups_sites.surql
-- Groups & Sites: Dance Groups, Studios, and Custom Websites
-- This migration creates advanced features for groups and custom sites
-- Requires: 0003_core_users.surql, 0004_lookup_tables.surql

-- ########################################################
-- Group Management Tables
-- ########################################################

-- Groups
-- Represents dance companies, studios, or teams
DEFINE TABLE group SCHEMAFULL
    PERMISSIONS
        FOR select WHERE is_public = true OR id IN (SELECT group FROM group_member WHERE user = $auth.id) OR $access = 'backend_worker'
        FOR create WHERE $auth != NONE OR $access = 'backend_worker'
        FOR update WHERE id IN (SELECT group FROM group_member WHERE user = $auth.id AND role IN ['owner', 'admin']) OR $access = 'backend_worker'
        FOR delete WHERE id IN (SELECT group FROM group_member WHERE user = $auth.id AND role = 'owner') OR $access = 'backend_worker';

DEFINE FIELD name ON group TYPE string;
DEFINE FIELD description ON group TYPE option<string>;
DEFINE FIELD group_type ON group TYPE string ASSERT $value IN ['studio', 'company', 'team', 'club', 'event'];
DEFINE FIELD location ON group TYPE option<object>;
DEFINE FIELD location.coordinates ON group TYPE option<geometry<point>>;
DEFINE FIELD location.city ON group TYPE option<record<city>>;
DEFINE FIELD location.address ON group TYPE option<string>;
DEFINE FIELD contact_info ON group TYPE option<object>;
DEFINE FIELD contact_info.email ON group TYPE option<string>;
DEFINE FIELD contact_info.phone ON group TYPE option<string>;
DEFINE FIELD contact_info.website ON group TYPE option<string>;
DEFINE FIELD logo_url ON group TYPE option<string>;
DEFINE FIELD cover_image_url ON group TYPE option<string>;
DEFINE FIELD is_public ON group TYPE bool DEFAULT true;
DEFINE FIELD is_verified ON group TYPE bool DEFAULT false;
DEFINE FIELD member_count ON group TYPE int DEFAULT 0;
DEFINE FIELD created_at ON group TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON group TYPE datetime DEFAULT time::now();
DEFINE FIELD deleted_at ON group TYPE option<datetime>;

DEFINE INDEX group_name ON group FIELDS name;
DEFINE INDEX group_type ON group FIELDS group_type;
DEFINE INDEX group_location ON group FIELDS location.coordinates MTREE DIMENSION 2;
DEFINE INDEX group_public ON group FIELDS is_public, created_at;

-- Group Membership
-- Tracks group membership and roles
DEFINE TABLE group_member SCHEMAFULL
    PERMISSIONS
        FOR select WHERE user = $auth.id OR group IN (SELECT group FROM group_member WHERE user = $auth.id AND role IN ['owner', 'admin']) OR $access = 'backend_worker'
        FOR create WHERE $access = 'backend_worker' OR group IN (SELECT group FROM group_member WHERE user = $auth.id AND role IN ['owner', 'admin'])
        FOR update WHERE group IN (SELECT group FROM group_member WHERE user = $auth.id AND role IN ['owner', 'admin']) OR $access = 'backend_worker'
        FOR delete WHERE user = $auth.id OR group IN (SELECT group FROM group_member WHERE user = $auth.id AND role IN ['owner', 'admin']) OR $access = 'backend_worker';

DEFINE FIELD user ON group_member TYPE record<user>;
DEFINE FIELD group ON group_member TYPE record<group>;
DEFINE FIELD role ON group_member TYPE string DEFAULT 'member' ASSERT $value IN ['owner', 'admin', 'instructor', 'member'];
DEFINE FIELD joined_at ON group_member TYPE datetime DEFAULT time::now();
DEFINE FIELD is_active ON group_member TYPE bool DEFAULT true;

DEFINE INDEX group_member_user_group ON group_member FIELDS user, group UNIQUE;
DEFINE INDEX group_member_group ON group_member FIELDS group;
DEFINE INDEX group_member_user ON group_member FIELDS user;

-- ########################################################
-- Custom Website Tables
-- ########################################################

-- Sites
-- Custom websites for users or groups
DEFINE TABLE site SCHEMAFULL
    PERMISSIONS
        FOR select WHERE is_public = true OR owner = $auth.id OR owner_group IN (SELECT group FROM group_member WHERE user = $auth.id AND role IN ['owner', 'admin']) OR $access = 'backend_worker'
        FOR create WHERE owner = $auth.id OR $access = 'backend_worker'
        FOR update WHERE owner = $auth.id OR owner_group IN (SELECT group FROM group_member WHERE user = $auth.id AND role IN ['owner', 'admin']) OR $access = 'backend_worker'
        FOR delete WHERE owner = $auth.id OR owner_group IN (SELECT group FROM group_member WHERE user = $auth.id AND role IN ['owner', 'admin']) OR $access = 'backend_worker';

DEFINE FIELD owner ON site TYPE option<record<user>>;
DEFINE FIELD owner_group ON site TYPE option<record<group>>;
DEFINE FIELD title ON site TYPE string;
DEFINE FIELD slug ON site TYPE string;
DEFINE FIELD description ON site TYPE option<string>;
DEFINE FIELD theme ON site TYPE string DEFAULT 'default';
DEFINE FIELD custom_css ON site TYPE option<string>;
DEFINE FIELD custom_domain ON site TYPE option<string>;
DEFINE FIELD is_public ON site TYPE bool DEFAULT true;
DEFINE FIELD is_published ON site TYPE bool DEFAULT false;
DEFINE FIELD seo_title ON site TYPE option<string>;
DEFINE FIELD seo_description ON site TYPE option<string>;
DEFINE FIELD analytics_code ON site TYPE option<string>;
DEFINE FIELD created_at ON site TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON site TYPE datetime DEFAULT time::now();

DEFINE INDEX site_owner ON site FIELDS owner;
DEFINE INDEX site_owner_group ON site FIELDS owner_group;
DEFINE INDEX site_slug ON site FIELDS slug UNIQUE;
DEFINE INDEX site_domain ON site FIELDS custom_domain UNIQUE;

-- Content Blocks
-- Modular content for sites
DEFINE TABLE content_block SCHEMAFULL
    PERMISSIONS
        FOR select WHERE site.is_public = true OR site.owner = $auth.id OR site.owner_group IN (SELECT group FROM group_member WHERE user = $auth.id AND role IN ['owner', 'admin']) OR $access = 'backend_worker'
        FOR create, update, delete WHERE site.owner = $auth.id OR site.owner_group IN (SELECT group FROM group_member WHERE user = $auth.id AND role IN ['owner', 'admin']) OR $access = 'backend_worker';

DEFINE FIELD site ON content_block TYPE record<site>;
DEFINE FIELD block_type ON content_block TYPE string ASSERT $value IN ['text', 'image', 'video', 'gallery', 'contact', 'calendar', 'social'];
DEFINE FIELD title ON content_block TYPE option<string>;
DEFINE FIELD content ON content_block TYPE option<string>;
DEFINE FIELD media_urls ON content_block TYPE array DEFAULT [];
DEFINE FIELD settings ON content_block TYPE option<object>;
DEFINE FIELD order ON content_block TYPE int DEFAULT 0;
DEFINE FIELD is_visible ON content_block TYPE bool DEFAULT true;
DEFINE FIELD created_at ON content_block TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON content_block TYPE datetime DEFAULT time::now();

DEFINE INDEX content_block_site ON content_block FIELDS site, order;