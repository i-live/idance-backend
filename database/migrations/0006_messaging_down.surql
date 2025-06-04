-- migrations/0006_messaging_down.surql
-- Messaging System Teardown: Remove all messaging related tables and indexes

-- Remove notification indexes
REMOVE INDEX IF EXISTS notification_created_at ON TABLE notification;
REMOVE INDEX IF EXISTS notification_type ON TABLE notification;
REMOVE INDEX IF EXISTS notification_user_read ON TABLE notification;
REMOVE INDEX IF EXISTS notification_user ON TABLE notification;

-- Remove comments indexes
REMOVE INDEX IF EXISTS comments_created_at ON TABLE comments;
REMOVE INDEX IF EXISTS comments_parent ON TABLE comments;
REMOVE INDEX IF EXISTS comments_author ON TABLE comments;
REMOVE INDEX IF EXISTS comments_target ON TABLE comments;

-- Remove message indexes
REMOVE INDEX IF EXISTS message_created_at ON TABLE message;
REMOVE INDEX IF EXISTS message_sender ON TABLE message;
REMOVE INDEX IF EXISTS message_chat ON TABLE message;

-- Remove chat indexes
REMOVE INDEX IF EXISTS chat_last_activity ON TABLE chat;
REMOVE INDEX IF EXISTS chat_participants ON TABLE chat;
REMOVE INDEX IF EXISTS chat_match ON TABLE chat;

-- Remove tables in correct dependency order
REMOVE TABLE IF EXISTS notification;
REMOVE TABLE IF EXISTS comments;
REMOVE TABLE IF EXISTS message;
REMOVE TABLE IF EXISTS chat;