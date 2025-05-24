-- migrations/0000_initial_schema.surql
-- Optimized SurrealDB schema for iDance
-- Uses SurrealDB v2.x.x with native authentication
-- Features:
-- - User authentication with OAuth (Google, Facebook, Apple)
-- - Granular location fields (country, state, county, city, zipcode, street)
-- - Multiple named search preferences for pro/vip geospatial searches
-- - Vlog_embedding for AI-driven lifestyle matching
-- - Graph edges for social interactions (follow, swipe, match, etc.)
-- - MTREE for geospatial, HNSW for embeddings
-- - Notifications for in-app (WebSocket via LIVE SELECT) and push (Cloudflare Worker + APNs/FCM)
-- - Supports groups, sites, and content blocks
-- - Events for real-time updates
-- Supports 100,000+ MAUs, Cloudflare Workers, NextAuth.js integration
-- Structured for clarity: Authentication → Users → Lookup → Social → Vlogs → Groups/Sites → Events

---- Authentication and Users ----

-- Authentication Scope
-- Defines session management for user authentication
DEFINE SCOPE idance SESSION 7d;

-- User
-- Stores general user data, authentication credentials, and OAuth providers
DEFINE TABLE user SCHEMAFULL
    PERMISSIONS
        FOR select WHERE id = $auth.id FULL
        FOR select WHERE user_status = 'active' FIELDS id, username, first_name, last_name, profile_picture_url
        FOR create WHERE id = $auth.id AND (SELECT count() FROM user WHERE id = $auth.id) = 0 FULL
        FOR update WHERE id = $auth.id OMIT email, password, oauth_providers, user_status, user_tier, stripe_customer_id
        FOR update WHERE $auth.roles CONTAINS 'site_admin' FULL;

DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD username ON user ASSERT $value != NONE AND $value MATCHES /^[a-z0-9]+(?:-[a-z0-9]+)*$/ AND string::len($value) >= 3 AND string::len($value) <= 30;
DEFINE FIELD first_name ON user TYPE string;
DEFINE FIELD first_name ON user ASSERT $value != NONE;
DEFINE FIELD last_name ON user TYPE string;
DEFINE FIELD last_name ON user ASSERT $value != NONE;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD email ON user ASSERT $value MATCHES /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
DEFINE FIELD password ON user TYPE option<string>;
DEFINE FIELD oauth_providers ON user TYPE array<object> DEFAULT [];
DEFINE FIELD oauth_providers.*.provider ON user TYPE string;
DEFINE FIELD oauth_providers.*.provider ON user ASSERT $value IN ['google', 'facebook', 'apple'];
DEFINE FIELD oauth_providers.*.id ON user TYPE string;
DEFINE FIELD phone_number ON user TYPE string;
DEFINE FIELD phone_number ON user ASSERT $value IS NULL OR $value MATCHES /^\+?[1-9]\d{1,14}$/;
DEFINE FIELD user_status ON user TYPE string DEFAULT 'pending_waitlist_approval';
DEFINE FIELD user_status ON user ASSERT $value IN ['pending_waitlist_approval', 'active', 'suspended', 'deleted'];
DEFINE FIELD user_tier ON user TYPE string DEFAULT 'basic';
DEFINE FIELD user_tier ON user ASSERT $value IN ['basic', 'pro', 'vip'];
DEFINE FIELD stripe_customer_id ON user TYPE option<string>;
DEFINE FIELD profile_picture_url ON user TYPE option<string>;
DEFINE FIELD profile_picture_url ON user ASSERT $value == NONE OR string::is::url($value);
DEFINE FIELD last_active_at ON user TYPE datetime DEFAULT time::now();
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now();

DEFINE INDEX user_username ON user FIELDS username UNIQUE;
DEFINE INDEX user_email ON user FIELDS email UNIQUE;
DEFINE INDEX user_stripe_customer_id ON user FIELDS stripe_customer_id UNIQUE WHERE stripe_customer_id != NONE;

-- Dance Profile
-- Stores physical user data (location, preferences, portfolio)
DEFINE TABLE profile SCHEMAFULL
    PERMISSIONS
        FOR select WHERE profile_status = 'active' FIELDS user_id, location, bio, social_links, awards, portfolio_items, looking_for, search_preferences
        FOR select WHERE user_id = $auth.id FULL
        FOR create WHERE user_id = $auth.id AND (SELECT count() FROM profile WHERE user_id = $auth.id) = 0 FULL
        FOR update WHERE user_id = $auth.id OMIT profile_status, bio_embedding, vlog_embedding
        FOR update WHERE $auth.roles CONTAINS 'site_admin' FULL;

DEFINE FIELD user_id ON profile TYPE record<user>;
DEFINE FIELD profile_type ON profile TYPE string DEFAULT 'dancer';
DEFINE FIELD profile_type ON profile ASSERT $value IN ['dancer', 'actor', 'model'];
DEFINE FIELD date_of_birth ON profile TYPE datetime;
DEFINE FIELD date_of_birth ON profile ASSERT $value != NONE;
DEFINE FIELD gender ON profile TYPE option<string>;
DEFINE FIELD gender ON profile ASSERT $value == NONE OR $value IN ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];
DEFINE FIELD bio ON profile TYPE option<string>;
DEFINE FIELD bio ON profile ASSERT $value == NONE OR string::len($value) <= 2000;
DEFINE FIELD bio_embedding ON profile TYPE array<float>;
DEFINE FIELD bio_embedding ON profile ASSERT array::len($value) = 1536;
DEFINE FIELD vlog_embedding ON profile TYPE option<array<float>>;
DEFINE FIELD vlog_embedding ON profile ASSERT $value == NONE OR (array::len($value) = 768 AND user_tier IN ['pro', 'vip']);
DEFINE FIELD looking_for ON profile TYPE array<string> DEFAULT [];
DEFINE FIELD looking_for.* ON profile ASSERT $value IN ['partners', 'jobs', 'dancers', 'events'];
DEFINE FIELD profile_status ON profile TYPE string DEFAULT 'active';
DEFINE FIELD profile_status ON profile ASSERT $value IN ['active', 'suspended', 'deleted'];

-- Location fields
DEFINE FIELD location ON profile TYPE object;
DEFINE FIELD location.country ON profile TYPE option<record<country>>;
DEFINE FIELD location.state ON profile TYPE option<record<state>>;
DEFINE FIELD location.county ON profile TYPE option<record<county>>;
DEFINE FIELD location.city ON profile TYPE option<record<city>>;
DEFINE FIELD location.zipcode ON profile TYPE option<string>;
DEFINE FIELD location.zipcode ON profile ASSERT $value == NONE OR $value MATCHES /^[0-9A-Z\- ]{3,10}$/;
DEFINE FIELD location.street ON profile TYPE option<string>;
DEFINE FIELD location.point ON profile TYPE option<geometry<point>>;
DEFINE FIELD location.custom_city ON profile TYPE option<string>;
DEFINE FIELD location.custom_city ON profile ASSERT $value == NONE OR user_tier IN ['pro', 'vip'];

-- Search preferences
DEFINE FIELD search_preferences ON profile TYPE array<object> DEFAULT [];
DEFINE FIELD search_preferences.*.name ON profile TYPE string;
DEFINE FIELD search_preferences.*.name ON profile ASSERT $value != NONE AND string::len($value) <= 50;
DEFINE FIELD search_preferences.*.search_area ON profile TYPE object;
DEFINE FIELD search_preferences.*.search_area.point ON profile TYPE geometry<point>;
DEFINE FIELD search_preferences.*.search_area.distance ON profile TYPE float;
DEFINE FIELD search_preferences.*.search_area.distance ON profile ASSERT $value > 0;
DEFINE FIELD search_preferences.*.active ON profile TYPE bool DEFAULT true;
DEFINE FIELD search_preferences ON profile ASSERT $value == [] OR user_tier IN ['pro', 'vip'];

-- Timestamps
DEFINE FIELD created_at ON profile TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON profile TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX profile_user_id ON profile FIELDS user_id UNIQUE;
DEFINE INDEX profile_location_city ON profile FIELDS location.city;
DEFINE INDEX profile_location_country ON profile FIELDS location.country;
DEFINE INDEX profile_location_state ON profile FIELDS location.state;
DEFINE INDEX profile_location_point ON profile FIELDS location.point MTREE;
DEFINE INDEX idx_bio_embedding ON profile FIELDS bio_embedding HNSW DIMENSION 1536 DIST COSINE TYPE F32;
DEFINE INDEX idx_vlog_embedding ON profile FIELDS vlog_embedding HNSW DIMENSION 768 DIST COSINE TYPE F32;

-- Social links
DEFINE FIELD social_links ON profile TYPE array<object> DEFAULT [];
DEFINE FIELD social_links.*.platform ON profile TYPE record<social_platform>;
DEFINE FIELD social_links.*.url ON profile TYPE string;
DEFINE FIELD social_links.*.url ON profile ASSERT string::is::url($value);

-- Awards
DEFINE FIELD awards ON profile TYPE array<object> DEFAULT [];
DEFINE FIELD awards.*.name ON profile TYPE string;
DEFINE FIELD awards.*.year ON profile TYPE option<int>;
DEFINE FIELD awards.*.description ON profile TYPE option<string>;

-- Portfolio items
DEFINE FIELD portfolio_items ON profile TYPE array<object> DEFAULT [];
DEFINE FIELD portfolio_items.*.item_type ON profile TYPE string;
DEFINE FIELD portfolio_items.*.item_type ON profile ASSERT $value IN ['video', 'image', 'project_link'];
DEFINE FIELD portfolio_items.*.url ON profile TYPE string;
DEFINE FIELD portfolio_items.*.url ON profile ASSERT string::is::url($value);
DEFINE FIELD portfolio_items.*.caption ON profile TYPE option<string>;
DEFINE FIELD portfolio_items.*.thumbnail_url ON profile TYPE option<string>;
DEFINE FIELD portfolio_items.*.thumbnail_url ON profile ASSERT $value == NONE OR string::is::url($value);
DEFINE FIELD portfolio_items.*.display_order ON profile TYPE int DEFAULT 0;

-- Device
-- Stores device tokens for push notifications
DEFINE TABLE device SCHEMAFULL
    PERMISSIONS
        FOR select, create, update, delete WHERE user = $auth.id;

DEFINE FIELD user ON device TYPE record<user>;
DEFINE FIELD token ON device TYPE string;
DEFINE FIELD token ON device ASSERT $value != NONE AND string::len($value) > 0;
DEFINE FIELD platform ON device TYPE string;
DEFINE FIELD platform ON device ASSERT $value IN ['ios', 'android', 'web'];
DEFINE FIELD created_at ON device TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON device TYPE datetime DEFAULT time::now();

DEFINE INDEX device_user_token ON device FIELDS user, token UNIQUE;

---- Lookup Tables ----

-- Countries (ISO 3166-1)
-- Referenced by profile.location.country
DEFINE TABLE country SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth.roles CONTAINS 'site_admin';

DEFINE FIELD code ON country TYPE string;
DEFINE FIELD code ON country ASSERT $value MATCHES /^[A-Z]{2}$/;
DEFINE FIELD name ON country TYPE string;
DEFINE FIELD name ON country ASSERT $value != NONE;
DEFINE FIELD created_at ON country TYPE datetime DEFAULT time::now();

DEFINE INDEX country_code ON country FIELDS code UNIQUE;

-- States (or prefectures, provinces)
-- Referenced by profile.location.state
DEFINE TABLE state SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth.roles CONTAINS 'site_admin';

DEFINE FIELD name ON state TYPE string;
DEFINE FIELD name ON state ASSERT $value != NONE;
DEFINE FIELD country ON state TYPE record<country>;
DEFINE FIELD created_at ON state TYPE datetime DEFAULT time::now();

DEFINE INDEX state_name_country ON state FIELDS name, country UNIQUE;

-- Counties
-- Referenced by profile.location.county
DEFINE TABLE county SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth.roles CONTAINS 'site_admin';

DEFINE FIELD name ON county TYPE string;
DEFINE FIELD name ON county ASSERT $value != NONE;
DEFINE FIELD state ON county TYPE record<state>;
DEFINE FIELD country ON county TYPE record<country>;
DEFINE FIELD created_at ON county TYPE datetime DEFAULT time::now();

DEFINE INDEX county_name_state ON county FIELDS name, state UNIQUE;

-- Cities
-- Referenced by profile.location.city
DEFINE TABLE city SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth.roles CONTAINS 'site_admin';

DEFINE FIELD name ON city TYPE string;
DEFINE FIELD name ON city ASSERT $value != NONE;
DEFINE FIELD country ON city TYPE record<country>;
DEFINE FIELD state ON city TYPE option<record<state>>;
DEFINE FIELD county ON city TYPE option<record<county>>;
DEFINE FIELD location_point ON city TYPE geometry<point>;
DEFINE FIELD created_at ON city TYPE datetime DEFAULT time::now();

DEFINE INDEX city_name_state ON city FIELDS name, state UNIQUE;

-- Dance Styles
-- Referenced by user_dance_style
DEFINE TABLE dance_style SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth.roles CONTAINS 'site_admin';

DEFINE FIELD name ON dance_style TYPE string;
DEFINE FIELD name ON dance_style ASSERT $value != NONE;
DEFINE FIELD created_at ON dance_style TYPE datetime DEFAULT time::now();

DEFINE INDEX dance_style_name ON dance_style FIELDS name UNIQUE;

-- Interests
-- Referenced by user_interest
DEFINE TABLE interest SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth.roles CONTAINS 'site_admin';

DEFINE FIELD name ON interest TYPE string;
DEFINE FIELD name ON interest ASSERT $value != NONE;
DEFINE FIELD created_at ON interest TYPE datetime DEFAULT time::now();

DEFINE INDEX interest_name ON interest FIELDS name UNIQUE;

-- Social Platforms
-- Referenced by profile.social_links
DEFINE TABLE social_platform SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE $auth.roles CONTAINS 'site_admin';

DEFINE FIELD name ON social_platform TYPE string;
DEFINE FIELD name ON social_platform ASSERT $value != NONE;
DEFINE FIELD created_at ON social_platform TYPE datetime DEFAULT time::now();

DEFINE INDEX social_platform_name ON social_platform FIELDS name UNIQUE;

---- Social Interactions and Relationships ----

-- Dance Style Relations
-- Links users to dance styles with proficiency
DEFINE TABLE user_dance_style SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE in = $auth.id;

DEFINE FIELD in ON user_dance_style TYPE record<user>;
DEFINE FIELD out ON user_dance_style TYPE record<dance_style>;
DEFINE FIELD proficiency_level ON user_dance_style TYPE string;
DEFINE FIELD proficiency_level ON user_dance_style ASSERT $value IN ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
DEFINE FIELD created_at ON user_dance_style TYPE datetime DEFAULT time::now();

DEFINE INDEX user_dance_style_unique ON user_dance_style FIELDS in, out UNIQUE;
DEFINE INDEX user_dance_style_out ON user_dance_style FIELDS out;

-- Interest Relations
-- Links users to interests
DEFINE TABLE user_interest SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create, update, delete WHERE in = $auth.id;

DEFINE FIELD in ON user_interest TYPE record<user>;
DEFINE FIELD out ON user_interest TYPE record<interest>;
DEFINE FIELD created_at ON user_interest TYPE datetime DEFAULT time::now();

DEFINE INDEX user_interest_unique ON user_interest FIELDS in, out UNIQUE;

-- Follow Relations
-- Represents user follow relationships
DEFINE TABLE follow SCHEMAFULL
    PERMISSIONS
        FOR select WHERE in = $auth.id OR out = $auth.id
        FOR create, delete WHERE in = $auth.id;

DEFINE FIELD in ON follow TYPE record<user>;
DEFINE FIELD out ON follow TYPE record<user>;
DEFINE FIELD created_at ON follow TYPE datetime DEFAULT time::now();

DEFINE INDEX follow_unique ON follow FIELDS in, out UNIQUE;

-- Comment Relations
-- Comments on vlogs
DEFINE TABLE comments SCHEMAFULL
    PERMISSIONS
        FOR select WHERE vlog.visibility = 'public' OR
                        (vlog.visibility = 'private' AND vlog.user = $auth.id) OR
                        (vlog.visibility = 'followers' AND (vlog.user = $auth.id OR $auth.id IN vlog.user->follow->in))
        FOR create WHERE in = $auth.id
        FOR update, delete WHERE in = $auth.id;

DEFINE FIELD in ON comments TYPE record<user>;
DEFINE FIELD out ON comments TYPE record<vlog>;
DEFINE FIELD content ON comments TYPE string;
DEFINE FIELD content ON comments ASSERT string::len($value) > 0;
DEFINE FIELD reply_to ON comments TYPE option<record<comments>>;
DEFINE FIELD created_at ON comments TYPE datetime DEFAULT time::now();

DEFINE INDEX comments_vlog ON comments FIELDS out, created_at;

-- Referral Relations
-- Tracks user referrals
DEFINE TABLE referred SCHEMAFULL
    PERMISSIONS
        FOR select WHERE in = $auth.id OR out = $auth.id OR $auth.roles CONTAINS 'site_admin'
        FOR create WHERE in = $auth.id
        FOR update WHERE $auth.roles CONTAINS 'site_admin';

DEFINE FIELD in ON referred TYPE record<user>;
DEFINE FIELD out ON referred TYPE record<user>;
DEFINE FIELD status ON referred TYPE string DEFAULT 'pending';
DEFINE FIELD status ON referred ASSERT $value IN ['pending', 'completed', 'expired', 'cancelled'];
DEFINE FIELD level ON referred TYPE int DEFAULT 1;
DEFINE FIELD level ON referred ASSERT $value >= 1;
DEFINE FIELD created_at ON referred TYPE datetime DEFAULT time::now();

DEFINE INDEX referred_unique ON referred FIELDS out UNIQUE;
DEFINE INDEX referred_in ON referred FIELDS in;

-- Swipes
-- Records user swipes (like, dislike, superlike)
DEFINE TABLE swipe SCHEMAFULL
    PERMISSIONS
        FOR select WHERE swiper = $auth.id OR swiped_user = $auth.id
        FOR create WHERE swiper = $auth.id;

DEFINE FIELD swiper ON swipe TYPE record<user>;
DEFINE FIELD swiped_user ON swipe TYPE record<user>;
DEFINE FIELD swipe_type ON swipe TYPE string;
DEFINE FIELD swipe_type ON swipe ASSERT $value IN ['like', 'dislike', 'superlike'];
DEFINE FIELD created_at ON swipe TYPE datetime DEFAULT time::now();

DEFINE INDEX swipe_unique ON swipe FIELDS swiper, swiped_user UNIQUE;
DEFINE INDEX swipe_swiper ON swipe FIELDS swiper;

-- Matches
-- Represents mutual likes
DEFINE TABLE match SCHEMAFULL
    PERMISSIONS
        FOR select WHERE user1 = $auth.id OR user2 = $auth.id
        FOR create WHERE $auth.roles CONTAINS 'site_admin';

DEFINE FIELD user1 ON match TYPE record<user>;
DEFINE FIELD user2 ON match TYPE record<user>;
DEFINE FIELD matched_at ON match TYPE datetime DEFAULT time::now();

DEFINE INDEX match_unique ON match FIELDS user1, user2 UNIQUE;

-- Chats
-- Stores chat sessions for matches
DEFINE TABLE chat SCHEMAFULL
    PERMISSIONS
        FOR select WHERE $auth.id IN participants
        FOR create WHERE $auth.roles CONTAINS 'site_admin'
        FOR update WHERE $auth.id IN participants;

DEFINE FIELD match ON chat TYPE record<match>;
DEFINE FIELD participants ON chat TYPE array<record<user>>;
DEFINE FIELD last_message ON chat TYPE option<record<message>>;
DEFINE FIELD last_activity ON chat TYPE datetime DEFAULT time::now();

DEFINE INDEX chat_match ON chat FIELDS match UNIQUE;

-- Messages
-- Chat messages
DEFINE TABLE message SCHEMAFULL
    PERMISSIONS
        FOR select WHERE $auth.id IN chat.participants
        FOR create WHERE sender = $auth.id AND $auth.id IN chat.participants
        FOR update, delete WHERE sender = $auth.id;

DEFINE FIELD chat ON message TYPE record<chat>;
DEFINE FIELD sender ON message TYPE record<user>;
DEFINE FIELD content_type ON message TYPE string;
DEFINE FIELD content_type ON message ASSERT $value IN ['text', 'image', 'video', 'audio'];
DEFINE FIELD content ON message TYPE string;
DEFINE FIELD media_url ON message TYPE option<string>;
DEFINE FIELD media_url ON message ASSERT $value == NONE OR string::is::url($value);
DEFINE FIELD sent_at ON message TYPE datetime DEFAULT time::now();

DEFINE INDEX message_chat ON message FIELDS chat, sent_at;

-- Notifications
-- Tracks events for in-app (WebSocket via LIVE SELECT) and push (Cloudflare Worker + APNs/FCM)
DEFINE TABLE notification SCHEMAFULL
    PERMISSIONS
        FOR select WHERE user = $auth.id
        FOR create WHERE $auth.roles CONTAINS 'site_admin'
        FOR update WHERE user = $auth.id;

DEFINE FIELD user ON notification TYPE record<user>;
DEFINE FIELD type ON notification TYPE string;
DEFINE FIELD type ON notification ASSERT $value IN ['like', 'comment', 'follow', 'match', 'swipe'];
DEFINE FIELD data ON notification TYPE object;
DEFINE FIELD read ON notification TYPE bool DEFAULT false;
DEFINE FIELD push_status ON notification TYPE string DEFAULT 'pending';
DEFINE FIELD push_status ON notification ASSERT $value IN ['pending', 'sent', 'failed'];
DEFINE FIELD created_at ON notification TYPE datetime DEFAULT time::now();

DEFINE INDEX notification_user ON notification FIELDS user, created_at;

---- Vlogs ----

-- Vlogs
-- User-generated content (posts, stories)
DEFINE TABLE vlog SCHEMALESS
    PERMISSIONS
        FOR select WHERE visibility = 'public' OR
                        (visibility = 'private' AND user = $auth.id) OR
                        (visibility = 'followers' AND (user = $auth.id OR $auth.id IN user->follow->in))
        FOR create, update, delete WHERE user = $auth.id;

DEFINE FIELD user ON vlog TYPE record<user>;
DEFINE FIELD post_type ON vlog TYPE string;
DEFINE FIELD post_type ON vlog ASSERT $value IN ['text', 'image', 'video', 'story'];
DEFINE FIELD title ON vlog TYPE option<string>;
DEFINE FIELD caption ON vlog TYPE option<string>;
DEFINE FIELD caption_embedding ON vlog TYPE array<float>;
DEFINE FIELD caption_embedding ON vlog ASSERT array::len($value) = 768;
DEFINE FIELD media_items ON vlog TYPE array<object>;
DEFINE FIELD engagement_counts ON vlog TYPE object DEFAULT { likes: 0, comments: 0, shares: 0 };
DEFINE FIELD visibility ON vlog TYPE string DEFAULT 'public';
DEFINE FIELD visibility ON vlog ASSERT $value IN ['public', 'followers', 'private'];
DEFINE FIELD created_at ON vlog TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON vlog TYPE datetime DEFAULT time::now();

DEFINE INDEX vlog_user ON vlog FIELDS user, created_at;
DEFINE INDEX idx_caption_embedding ON vlog FIELDS caption_embedding HNSW DIMENSION 768 DIST COSINE TYPE F32;

-- Vlog Likes
-- Tracks likes on vlogs
DEFINE TABLE vlog_like SCHEMAFULL
    PERMISSIONS
        FOR select WHERE vlog.visibility = 'public' OR
                        (vlog.visibility = 'private' AND vlog.user = $auth.id) OR
                        (vlog.visibility = 'followers' AND (vlog.user = $auth.id OR $auth.id IN vlog.user->follow->in))
        FOR create, delete WHERE user = $auth.id;

DEFINE FIELD vlog ON vlog_like TYPE record<vlog>;
DEFINE FIELD user ON vlog_like TYPE record<user>;
DEFINE FIELD created_at ON vlog_like TYPE datetime DEFAULT time::now();

DEFINE INDEX vlog_like_unique ON vlog_like FIELDS vlog, user UNIQUE;

---- Groups and Sites ----

-- Groups
-- Represents dance companies, studios, or teams
DEFINE TABLE group SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create WHERE $auth.id != NONE
        FOR update WHERE $auth.id IN (SELECT user FROM group_member WHERE group = $after.id AND role IN ['admin', 'owner'])
        FOR delete WHERE $auth.id IN (SELECT user FROM group_member WHERE group = $before.id AND role = 'owner');

DEFINE FIELD name ON group TYPE string;
DEFINE FIELD name ON group ASSERT $value != NONE;
DEFINE FIELD type ON group TYPE string;
DEFINE FIELD type ON group ASSERT $value IN ['company', 'studio', 'team'];
DEFINE FIELD subdomain ON group TYPE string;
DEFINE FIELD subdomain ON group ASSERT $value MATCHES /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
DEFINE FIELD custom_domain ON group TYPE option<string>;
DEFINE FIELD settings ON group TYPE object DEFAULT {};
DEFINE FIELD created_at ON group TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON group TYPE datetime DEFAULT time::now();

DEFINE INDEX group_subdomain ON group FIELDS subdomain UNIQUE;
DEFINE INDEX group_custom_domain ON group FIELDS custom_domain UNIQUE WHERE custom_domain != NONE;

-- Group Members
-- Tracks group membership and roles
DEFINE TABLE group_member SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create WHERE $auth.id IN (SELECT user FROM group_member WHERE group = $value.group AND role IN ['admin', 'owner'])
        FOR update WHERE $auth.id IN (SELECT user FROM group_member WHERE group = $after.group AND role IN ['admin', 'owner'])
        FOR delete WHERE $before.user = $auth.id OR $auth.id IN (SELECT user FROM group_member WHERE group = $before.group AND role IN ['admin', 'owner']);

DEFINE FIELD group ON group_member TYPE record<group>;
DEFINE FIELD user ON group_member TYPE record<user>;
DEFINE FIELD role ON group_member TYPE string;
DEFINE FIELD role ON group_member ASSERT $value IN ['owner', 'admin', 'member'];
DEFINE FIELD joined_at ON group_member TYPE datetime DEFAULT time::now();

DEFINE INDEX group_member_unique ON group_member FIELDS group, user UNIQUE;

-- Sites
-- Custom websites for users or groups
DEFINE TABLE site SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create WHERE (owner = $auth.id AND owner_type = 'user') OR
                        (owner_type = 'group' AND $auth.id IN (SELECT user FROM group_member WHERE group = $value.owner AND role IN ['admin', 'owner']))
        FOR update, delete WHERE (owner = $auth.id AND owner_type = 'user') OR
                                (owner_type = 'group' AND $auth.id IN (SELECT user FROM group_member WHERE group = $before.owner AND role IN ['admin', 'owner']));

DEFINE FIELD owner ON site TYPE record<user> | record<group>;
DEFINE FIELD owner_type ON site TYPE string;
DEFINE FIELD owner_type ON site ASSERT $value IN ['user', 'group'];
DEFINE FIELD theme ON site TYPE option<string>;
DEFINE FIELD layout ON site TYPE option<object>;
DEFINE FIELD settings ON site TYPE option<object>;
DEFINE FIELD custom_domain ON site TYPE option<string>;
DEFINE FIELD site_title ON site TYPE option<string>;
DEFINE FIELD site_description ON site TYPE option<string>;
DEFINE FIELD use_app_profile ON site TYPE bool DEFAULT false;
DEFINE FIELD show_contact_form ON site TYPE bool DEFAULT false;
DEFINE FIELD contact_email ON site TYPE option<string>;
DEFINE FIELD contact_email ON site ASSERT $value == NONE OR string::is::email($value);
DEFINE FIELD social_links ON site TYPE array<object>;
DEFINE FIELD featured_content ON site TYPE array<object>;
DEFINE FIELD custom_sections ON site TYPE array<object>;
DEFINE FIELD created_at ON site TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON site TYPE datetime DEFAULT time::now();

DEFINE INDEX site_custom_domain ON site FIELDS custom_domain UNIQUE WHERE custom_domain != NONE;
DEFINE INDEX site_owner ON site FIELDS owner, owner_type;

-- Content Blocks
-- Modular content for sites
DEFINE TABLE content_block SCHEMAFULL
    PERMISSIONS
        FOR select WHERE published = true OR
                        (site.owner = $auth.id AND site.owner_type = 'user') OR
                        (site.owner_type = 'group' AND $auth.id IN (SELECT user FROM group_member WHERE group = site.owner AND role IN ['admin', 'owner']))
        FOR create, update, delete WHERE (site.owner = $auth.id AND site.owner_type = 'user') OR
                                        (site.owner_type = 'group' AND $auth.id IN (SELECT user FROM group_member WHERE group = site.owner AND role IN ['admin', 'owner']));

DEFINE FIELD site ON content_block TYPE record<site>;
DEFINE FIELD type ON content_block TYPE string;
DEFINE FIELD type ON content_block ASSERT $value IN ['text', 'gallery', 'video', 'html_embed', 'profile_summary'];
DEFINE FIELD order ON content_block TYPE int DEFAULT 0;
DEFINE FIELD content ON content_block TYPE object;
DEFINE FIELD published ON content_block TYPE bool DEFAULT false;
DEFINE FIELD created_at ON content_block TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON content_block TYPE datetime DEFAULT time::now();

DEFINE INDEX content_block_site ON content_block FIELDS site, order;

---- Events ----

-- New Message
-- Updates chat and notifies recipient
DEFINE EVENT new_message ON TABLE message WHEN $event = "CREATE" THEN (
    LET $chat_id = $after.chat;
    UPDATE chat SET last_message = $after.id, last_activity = time::now() WHERE id = $chat_id;
    CREATE notification SET
        user = array::first(array::remove($after.chat.participants, $after.sender)),
        type = 'message',
        data = { chat: $after.chat, sender: $after.sender },
        created_at = time::now();
);

-- New Match
-- Creates chat and notifies both users
DEFINE EVENT new_match ON TABLE match WHEN $event = "CREATE" THEN (
    CREATE chat SET match = $after.id, participants = [$after.user1, $after.user2], last_activity = time::now();
    CREATE notification SET
        user = $after.user1,
        type = 'match',
        data = { match: $after.id, other_user: $after.user2 },
        created_at = time::now();
    CREATE notification SET
        user = $after.user2,
        type = 'match',
        data = { match: $after.id, other_user: $after.user1 },
        created_at = time::now();
);

-- New Swipe
-- Checks for mutual likes and notifies swiped user
DEFINE EVENT new_swipe ON TABLE swipe WHEN $event = "CREATE" AND $after.swipe_type = 'like' THEN (
    LET $swiper = $after.swiper;
    LET $swiped = $after.swiped_user;
    LET $mutual = (SELECT * FROM swipe WHERE swiper = $swiped AND swiped_user = $swiper AND swipe_type = 'like');
    IF array::len($mutual) > 0 THEN
        CREATE match SET user1 = $swiper, user2 = $swiped, matched_at = time::now();
    END;
    CREATE notification SET
        user = $after.swiped_user,
        type = 'swipe',
        data = { swiper: $after.swiper, swipe_type: $after.swipe_type },
        created_at = time::now();
);

-- Vlog Like Update
-- Updates like count
DEFINE EVENT vlog_like_update ON TABLE vlog_like WHEN $event IN ["CREATE", "DELETE"] THEN (
    LET $vlog_id = $after.vlog;
    LET $like_count = (SELECT count() FROM vlog_like WHERE vlog = $vlog_id);
    UPDATE vlog SET engagement_counts.likes = $like_count WHERE id = $vlog_id;
);

-- Vlog Like Notification
-- Notifies vlog owner (triggers push via Cloudflare Worker)
DEFINE EVENT vlog_like_notify ON TABLE vlog_like WHEN $event = "CREATE" THEN (
    CREATE notification SET
        user = $after.vlog.user,
        type = 'like',
        data = { vlog: $after.vlog, liker: $after.user },
        created_at = time::now();
);

-- Vlog Comment Update
-- Updates comment count and notifies vlog owner
DEFINE EVENT vlog_comment_update ON TABLE comments WHEN $event = "CREATE" THEN (
    LET $vlog_id = $after.out;
    LET $comment_count = (SELECT count() FROM comments WHERE out = $vlog_id);
    UPDATE vlog SET engagement_counts.comments = $comment_count WHERE id = $vlog_id;
    CREATE notification SET
        user = $after.out.user,
        type = 'comment',
        data = { vlog: $after.out, commenter: $after.in },
        created_at = time::now();
);

-- New Follow
-- Notifies followed user
DEFINE EVENT new_follow ON TABLE follow WHEN $event = "CREATE" THEN (
    CREATE notification SET
        user = $after.out,
        type = 'follow',
        data = { follower: $after.in },
        created_at = time::now();
);

-- Vlog Embedding Update
-- Updates vlog embedding for pro/vip users
DEFINE EVENT update_vlog_embedding ON TABLE vlog WHEN $event IN ["CREATE", "UPDATE", "DELETE"] THEN (
    LET $user_id = $after.user;
    LET $vlogs = (SELECT caption FROM vlog WHERE user = $user_id);
    LET $text = array::join(array::flatten($vlogs.caption), ' ');
    LET $embedding = <future>fn::generate_embedding($text);
    UPDATE profile SET vlog_embedding = $embedding WHERE user_id = $user_id AND user_tier IN ['pro', 'vip'];
);


-- Helper Functions
DEFINE FUNCTION fn::is_match_member($match_id: record<match>, $user_id: record<user>) RETURNS bool {
  RETURN (SELECT id FROM match WHERE id = $match_id AND (user1 = $user_id OR user2 = $user_id) LIMIT 1) IS NOT NONE;
};

DEFINE FUNCTION fn::is_chat_member($chat_id: record<chat>, $user_id: record<user>) RETURNS bool {
  LET $match_id = (SELECT match FROM chat WHERE id = $chat_id LIMIT 1);
  RETURN $match_id IS NONE ? false : fn::is_match_member($match_id, $user_id);
};

DEFINE FUNCTION fn::can_view_vlog($vlog_id: record<vlog>, $user_id: record<user>) RETURNS bool {
  LET $vlog = (SELECT user, visibility FROM vlog WHERE id = $vlog_id LIMIT 1);
  RETURN $vlog IS NONE ? false :
         $vlog.visibility = 'public' ? true :
         $user_id IS NONE ? false :
         $vlog.user = $user_id ? true :
         $vlog.visibility = 'followers' AND (SELECT id FROM follower WHERE follower = $user_id AND followed = $vlog.user LIMIT 1) IS NOT NONE;
};

DEFINE FUNCTION fn::is_group_admin_or_owner($group_id: record<group>, $user_id: record<user>) RETURNS bool {
  RETURN (SELECT id FROM group_member WHERE group = $group_id AND user = $user_id AND role IN ['admin', 'owner'] LIMIT 1) IS NOT NONE;
};

DEFINE FUNCTION fn::is_group_owner($group_id: record<group>, $user_id: record<user>) RETURNS bool {
  RETURN (SELECT id FROM group_member WHERE group = $group_id AND user = $user_id AND role = 'owner' LIMIT 1) IS NOT NONE;
};

DEFINE FUNCTION fn::is_sole_owner($group_id: record<group>, $user_id: record<user>) RETURNS bool {
  LET $is_owner = (SELECT role = 'owner' FROM group_member WHERE group = $group_id AND user = $user_id LIMIT 1);
  RETURN $is_owner ? (SELECT count() FROM group_member WHERE group = $group_id AND role = 'owner' GROUP ALL) = 1 : false;
};

DEFINE FUNCTION fn::can_manage_site($site_id: record<site>, $user_id: record<user>) RETURNS bool {
  LET $site = (SELECT owner, owner_type FROM site WHERE id = $site_id LIMIT 1);
  RETURN $site IS NONE ? false :
         $site.owner_type = 'user' ? $site.owner = $user_id :
         fn::is_group_admin_or_owner($site.owner, $user_id);
};

DEFINE FUNCTION fn::can_manage_media($media_id: record<media_asset>, $user_id: record<user>) RETURNS bool {
  LET $media = (SELECT owner, owner_type FROM media_asset WHERE id = $media_id LIMIT 1);
  RETURN $media IS NONE ? false :
         $media.owner_type = 'user' ? $media.owner = $user_id :
         fn::is_group_admin_or_owner($media.owner, $user_id);
};

DEFINE FUNCTION fn::can_view_profile($profile_id: record<profile>, $user_id: record<user>) RETURNS bool {
  LET $profile = (SELECT user, profile_status FROM profile WHERE id = $profile_id LIMIT 1);
  RETURN $profile IS NONE ? false :
         $profile.profile_status = 'active' ? true :
         $user_id IS NONE ? false :
         $profile.user = $user_id;
};