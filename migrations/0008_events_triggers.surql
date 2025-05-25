-- migrations/0008_events_triggers.surql
-- Events & Triggers: Real-time Database Events and Automation
-- This migration creates database events for real-time features and automation
-- Requires: 0005_social_interactions.surql, 0006_messaging.surql

-- ########################################################
-- Database Events and Triggers
-- ########################################################

-- New Message Event
-- Updates chat and notifies recipient when a new message is created
DEFINE EVENT new_message ON TABLE message WHEN $event = "CREATE" THEN (
    LET $chat_id = $after.chat;
    UPDATE chat SET last_message = $after.id, last_activity = time::now() WHERE id = $chat_id;
    CREATE notification SET
        user = array::first(array::remove($after.chat.participants, $after.sender)),
        type = 'message',
        title = 'New Message',
        body = 'You have a new message from ' + $after.sender.first_name,
        data = { chat: $after.chat, sender: $after.sender },
        created_at = time::now();
);

-- New Match Event
-- Creates chat and notifies both users when a new match is created
DEFINE EVENT new_match ON TABLE match WHEN $event = "CREATE" THEN (
    CREATE chat SET match = $after.id, participants = [$after.user1, $after.user2], last_activity = time::now();
    CREATE notification SET
        user = $after.user1,
        type = 'match',
        title = 'New Match!',
        body = 'You have a new match with ' + $after.user2.first_name,
        data = { match: $after.id, other_user: $after.user2 },
        created_at = time::now();
    CREATE notification SET
        user = $after.user2,
        type = 'match',
        title = 'New Match!',
        body = 'You have a new match with ' + $after.user1.first_name,
        data = { match: $after.id, other_user: $after.user1 },
        created_at = time::now();
);

-- New Follow Event
-- Notifies user when someone follows them
DEFINE EVENT new_follow ON TABLE follow WHEN $event = "CREATE" THEN (
    CREATE notification SET
        user = $after.following,
        type = 'follow',
        title = 'New Follower',
        body = $after.follower.first_name + ' started following you',
        data = { follower: $after.follower },
        created_at = time::now();
);

-- New Vlog Like Event
-- Updates like count and notifies vlog author
DEFINE EVENT new_vlog_like ON TABLE vlog_like WHEN $event = "CREATE" THEN (
    UPDATE vlog SET likes_count = likes_count + 1 WHERE id = $after.vlog;
    IF $after.vlog.author != $after.user {
        CREATE notification SET
            user = $after.vlog.author,
            type = 'like',
            title = 'Vlog Liked',
            body = $after.user.first_name + ' liked your vlog',
            data = { vlog: $after.vlog, liker: $after.user },
            created_at = time::now();
    };
);

-- Remove Vlog Like Event
-- Updates like count when a like is removed
DEFINE EVENT remove_vlog_like ON TABLE vlog_like WHEN $event = "DELETE" THEN (
    UPDATE vlog SET likes_count = likes_count - 1 WHERE id = $before.vlog;
);

-- New Comment Event
-- Updates comment count and notifies content author
DEFINE EVENT new_comment ON TABLE comments WHEN $event = "CREATE" THEN (
    IF $after.target_type = 'vlog' {
        UPDATE vlog SET comments_count = comments_count + 1 WHERE id = $after.target_id;
        LET $vlog = SELECT * FROM vlog WHERE id = $after.target_id;
        IF $vlog AND $vlog[0].author != $after.author {
            CREATE notification SET
                user = $vlog[0].author,
                type = 'comment',
                title = 'New Comment',
                body = $after.author.first_name + ' commented on your vlog',
                data = { vlog: $after.target_id, commenter: $after.author },
                created_at = time::now();
        };
    };
);

-- User Status Update Event
-- Logs user status changes for audit purposes
DEFINE EVENT user_status_change ON TABLE user WHEN $event = "UPDATE" AND $before.user_status != $after.user_status THEN (
    -- Could log to an audit table or send admin notifications
    -- For now, just update the updated_at timestamp
    UPDATE user SET updated_at = time::now() WHERE id = $after.id;
);

-- Group Member Count Update Events
-- Maintains accurate member counts for groups
DEFINE EVENT group_member_added ON TABLE group_member WHEN $event = "CREATE" THEN (
    UPDATE group SET member_count = member_count + 1 WHERE id = $after.group;
);

DEFINE EVENT group_member_removed ON TABLE group_member WHEN $event = "DELETE" THEN (
    UPDATE group SET member_count = member_count - 1 WHERE id = $before.group;
);

-- Profile Update Event
-- Updates user.updated_at when profile is modified
DEFINE EVENT profile_updated ON TABLE profile WHEN $event = "UPDATE" THEN (
    UPDATE user SET updated_at = time::now() WHERE id = $after.user;
);

-- Auto-Match Detection Event
-- Automatically creates matches when mutual likes are detected
DEFINE EVENT auto_match_detection ON TABLE swipe WHEN $event = "CREATE" AND $after.swipe_type = "like" THEN (
    LET $mutual_like = SELECT * FROM swipe WHERE swiper = $after.swiped AND swiped = $after.swiper AND swipe_type = "like";
    IF $mutual_like {
        LET $existing_match = SELECT * FROM match WHERE 
            (user1 = $after.swiper AND user2 = $after.swiped) OR 
            (user1 = $after.swiped AND user2 = $after.swiper);
        IF !$existing_match {
            CREATE match SET 
                user1 = $after.swiper, 
                user2 = $after.swiped, 
                matched_at = time::now();
        };
    };
);