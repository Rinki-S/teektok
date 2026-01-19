CREATE TABLE `relation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '粉丝ID (主动关注者)',
  `target_id` bigint(20) NOT NULL COMMENT '被关注者ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_relation` (`user_id`,`target_id`) COMMENT '防止重复关注',
  KEY `idx_user` (`user_id`) COMMENT '查询我的关注列表',
  KEY `idx_target` (`target_id`) COMMENT '查询我的粉丝列表'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注关系表';
