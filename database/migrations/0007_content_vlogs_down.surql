-- migrations/0007_content_vlogs_down.surql
-- Content/Vlogs Teardown: Remove content tables

-- Remove content tables
REMOVE TABLE vlog_comment;
REMOVE TABLE vlog_like;
REMOVE TABLE vlog;