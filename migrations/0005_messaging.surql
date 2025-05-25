-- migrations/0005_messaging.surql
-- Messaging System: Chat, Messages, Comments, and Notifications
-- This migration creates the real-time messaging and notification system
-- Requires: 0003_core_users.surql, 0005_social_interactions.surql

-- ########################################################
-- Chat and Messaging Tables
-- ########################################################

-- Chat Sessions
-- Stores chat sessions for matches
DEFINE TABLE chat SCHEMAFULL
    PERMISSIONS
        FOR select WHERE array::any(participants) = $auth.id OR $access = 'worker'
        FOR create WHERE $access = 'worker'
        FOR update WHERE array::any(participants) = $auth.id OR $access = 'worker'
        FOR delete WHERE $access = 'worker';

DEFINE FIELD match ON chat TYPE option<record<match>>;
DEFINE FIELD participants ON chat TYPE array<record<user>>;
DEFINE FIELD last_message ON chat TYPE option<record<message>>;
DEFINE FIELD last_activity ON chat TYPE datetime DEFAULT time::now();
DEFINE FIELD is_active ON chat TYPE bool DEFAULT true;
DEFINE FIELD created_at ON chat TYPE datetime DEFAULT time::now();

DEFINE INDEX chat_match ON chat FIELDS match UNIQUE;
DEFINE INDEX chat_participants ON chat FIELDS participants;
DEFINE INDEX chat_last_activity ON chat FIELDS last_activity;

-- Chat Messages
-- Individual messages within chats
DEFINE TABLE message SCHEMAFULL
    PERMISSIONS
        FOR select WHERE array::any(chat.participants) = $auth.id OR $access = 'worker'
        FOR create WHERE sender = $auth.id OR $access = 'worker'
        FOR update WHERE sender = $auth.id OR $access = 'worker'
        FOR delete WHERE sender = $auth.id OR $access = 'worker';

DEFINE FIELD chat ON message TYPE record<chat>;
DEFINE FIELD sender ON message TYPE record<user>;
DEFINE FIELD content ON message TYPE string;
DEFINE FIELD message_type ON message TYPE string DEFAULT 'text' ASSERT $value IN ['text', 'image', 'video', 'audio', 'gif', 'sticker'];
DEFINE FIELD media_url ON message TYPE option<string>;
DEFINE FIELD read_by ON message TYPE array DEFAULT [];
DEFINE FIELD created_at ON message TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON message TYPE datetime DEFAULT time::now();
DEFINE FIELD deleted_at ON message TYPE option<datetime>;

DEFINE INDEX message_chat ON message FIELDS chat;
DEFINE INDEX message_sender ON message FIELDS sender;
DEFINE INDEX message_created_at ON message FIELDS created_at;

-- Comments
-- Comments on vlogs and other content
DEFINE TABLE comments SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create WHERE author = $auth.id OR $access = 'worker'
        FOR update WHERE author = $auth.id OR $access = 'worker'
        FOR delete WHERE author = $auth.id OR $access = 'worker';

DEFINE FIELD author ON comments TYPE record<user>;
DEFINE FIELD content ON comments TYPE string;
DEFINE FIELD target_type ON comments TYPE string ASSERT $value IN ['vlog', 'profile', 'group'];
DEFINE FIELD target_id ON comments TYPE string;
DEFINE FIELD parent_comment ON comments TYPE option<record<comments>>;
DEFINE FIELD likes_count ON comments TYPE int DEFAULT 0;
DEFINE FIELD created_at ON comments TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON comments TYPE datetime DEFAULT time::now();
DEFINE FIELD deleted_at ON comments TYPE option<datetime>;

DEFINE INDEX comments_target ON comments FIELDS target_type, target_id;
DEFINE INDEX comments_author ON comments FIELDS author;
DEFINE INDEX comments_parent ON comments FIELDS parent_comment;
DEFINE INDEX comments_created_at ON comments FIELDS created_at;

-- ########################################################
-- Notification System
-- ########################################################

-- Notifications
-- Tracks events for in-app (WebSocket via LIVE SELECT) and push (Cloudflare Worker + APNs/FCM)
DEFINE TABLE notification SCHEMAFULL
    PERMISSIONS
        FOR select WHERE user = $auth.id OR $access = 'worker'
        FOR create WHERE $access = 'worker'
        FOR update WHERE user = $auth.id OR $access = 'worker'
        FOR delete WHERE user = $auth.id OR $access = 'worker';

DEFINE FIELD user ON notification TYPE record<user>;
DEFINE FIELD type ON notification TYPE string ASSERT $value IN ['message', 'match', 'like', 'comment', 'follow', 'system'];
DEFINE FIELD title ON notification TYPE string;
DEFINE FIELD body ON notification TYPE string;
DEFINE FIELD data ON notification TYPE option<object>;
DEFINE FIELD is_read ON notification TYPE bool DEFAULT false;
DEFINE FIELD is_pushed ON notification TYPE bool DEFAULT false;
DEFINE FIELD created_at ON notification TYPE datetime DEFAULT time::now();

DEFINE INDEX notification_user ON notification FIELDS user;
DEFINE INDEX notification_user_read ON notification FIELDS user, is_read;
DEFINE INDEX notification_type ON notification FIELDS type;
DEFINE INDEX notification_created_at ON notification FIELDS created_at;