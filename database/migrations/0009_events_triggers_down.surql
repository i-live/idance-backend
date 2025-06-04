-- migrations/0009_events_triggers_down.surql
-- Events & Triggers Teardown: Remove all events defined in the up migration

-- Remove events in reverse order of creation
REMOVE EVENT IF EXISTS auto_match_detection ON TABLE swipe;
REMOVE EVENT IF EXISTS profile_updated ON TABLE profile;
REMOVE EVENT IF EXISTS group_member_removed ON TABLE group_member;
REMOVE EVENT IF EXISTS group_member_added ON TABLE group_member;
REMOVE EVENT IF EXISTS user_status_change ON TABLE user;
REMOVE EVENT IF EXISTS new_comment ON TABLE comments;
REMOVE EVENT IF EXISTS remove_vlog_like ON TABLE vlog_like;
REMOVE EVENT IF EXISTS new_vlog_like ON TABLE vlog_like;
REMOVE EVENT IF EXISTS new_follow ON TABLE follow;
REMOVE EVENT IF EXISTS new_match ON TABLE match;
REMOVE EVENT IF EXISTS new_message ON TABLE message;
