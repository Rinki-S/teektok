接口文档与接口-DTO-VO映射文档：启动项目后，用下面网址
http://localhost:8080/swagger-ui/index.html#/

数据库建表语句（1-16 9:37）：
create table admin
(
    id          int auto_increment comment '管理员ID'
        primary key,
    username    varchar(50)                        not null,
    password    varchar(100)                       not null,
    create_time datetime default CURRENT_TIMESTAMP null
)
    comment '管理员表';

create table comment
(
    id          int auto_increment comment '评论ID'
        primary key,
    video_id    int                                not null comment '视频ID',
    user_id     int                                not null comment '用户ID',
    content     varchar(500)                       not null comment '评论内容',
    status      tinyint  default 0                 null comment '状态：0正常 1禁用',
    create_time datetime default CURRENT_TIMESTAMP null
)
    comment '评论表';

create table user
(
    id          int auto_increment comment '用户ID'
        primary key,
    username    varchar(50)                        not null comment '用户名',
    password    varchar(100)                       not null comment '密码',
    status      tinyint  default 0                 null comment '状态：0正常 1冻结',
    avatar      varchar(255)                       null comment '头像URL',
    create_time datetime default CURRENT_TIMESTAMP null comment '注册时间',
    phone       varchar(11)                        null
)
    comment '用户表';

create table user_behavior
(
    id           int auto_increment comment '行为ID'
        primary key,
    user_id      int                                not null comment '用户ID',
    video_id     int                                not null comment '视频ID',
    collect_type tinyint                            not null comment '1播放 2点赞 3收藏 4评论',
    create_time  datetime default CURRENT_TIMESTAMP null
)
    comment '用户行为记录表';

create table video
(
    id          int auto_increment comment '视频ID'
        primary key,
    title       varchar(255)                       not null comment '视频标题',
    video_url   varchar(255)                       not null comment '视频地址',
    cover_url   varchar(255)                       null comment '封面图',
    description varchar(255)                       null comment '视频描述',
    uploader_id int                                not null comment '上传用户ID',
    status      tinyint  default 0                 null comment '状态：0待审核 1通过 2拒绝',
    is_hot      tinyint  default 0                 null comment '是否热门：0否 1是',
    is_deleted  tinyint  default 0                 null comment '逻辑删除：0否 1是',
    create_time datetime default CURRENT_TIMESTAMP null,
    update_time datetime default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP
)
    comment '视频表';

create table video_collect
(
    id          int auto_increment comment '收藏ID'
        primary key,
    video_id    int                                not null,
    user_id     int                                not null,
    create_time datetime default CURRENT_TIMESTAMP null,
    constraint uk_user_video
        unique (video_id, user_id)
)
    comment '视频收藏表';

create table video_like
(
    id          int auto_increment comment '点赞ID'
        primary key,
    video_id    int                                not null,
    user_id     int                                not null,
    create_time datetime default CURRENT_TIMESTAMP null,
    constraint uk_user_video
        unique (video_id, user_id)
)
    comment '视频点赞表';

create table video_stat
(
    video_id      int                                not null comment '视频ID'
        primary key,
    play_count    int      default 0                 null,
    like_count    int      default 0                 null,
    comment_count int      default 0                 null,
    collect_count int      default 0                 null,
    update_time   datetime default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    share_count   int                                null comment '分享数'
)
    comment '视频统计表';

