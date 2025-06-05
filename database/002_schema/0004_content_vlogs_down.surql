-- migrations/0007_content_vlogs_down.surql
-- Content/Vlogs Teardown: Remove vlog related tables and indexes

-- Remove vlog_like indexes
REMOVE INDEX IF EXISTS vlog_like_user_vlog ON TABLE vlog_like;
REMOVE INDEX IF EXISTS vlog_like_vlog ON TABLE vlog_like;
REMOVE INDEX IF EXISTS vlog_like_user ON TABLE vlog_like;

-- Remove vlog indexes
REMOVE INDEX IF EXISTS vlog_author ON TABLE vlog;
REMOVE INDEX IF EXISTS vlog_public ON TABLE vlog;
REMOVE INDEX IF EXISTS vlog_featured ON TABLE vlog;
REMOVE INDEX IF EXISTS vlog_tags ON TABLE vlog;
REMOVE INDEX IF EXISTS vlog_created_at ON TABLE vlog;

-- Remove tables in correct dependency order
REMOVE TABLE IF EXISTS vlog_like;
REMOVE TABLE IF EXISTS vlog;