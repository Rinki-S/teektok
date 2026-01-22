SET @db := DATABASE();

SET @rename_sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db
        AND table_name = 'user_behavior'
        AND column_name = 'favorite_type'
    )
    AND NOT EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db
        AND table_name = 'user_behavior'
        AND column_name = 'behavior_type'
    ),
    "ALTER TABLE user_behavior CHANGE favorite_type behavior_type TINYINT NOT NULL COMMENT '1播放 2点赞 3收藏 4评论 5转发'",
    "SELECT 1"
  )
);
PREPARE stmt FROM @rename_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_sql := (
  SELECT IF(
    NOT EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = @db
        AND table_name = 'user_behavior'
        AND index_name = 'idx_user_type_time'
    ),
    "ALTER TABLE user_behavior ADD INDEX idx_user_type_time (user_id, behavior_type, create_time)",
    "SELECT 1"
  )
);
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
