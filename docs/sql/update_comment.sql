-- 添加父评论ID和点赞数字段
ALTER TABLE `comment` 
ADD COLUMN `parent_id` BIGINT DEFAULT NULL COMMENT '父评论ID',
ADD COLUMN `like_count` BIGINT DEFAULT 0 COMMENT '点赞数';

-- 创建评论点赞表
CREATE TABLE `comment_like` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `comment_id` bigint(20) NOT NULL COMMENT '评论ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_comment_user` (`comment_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论点赞表';
