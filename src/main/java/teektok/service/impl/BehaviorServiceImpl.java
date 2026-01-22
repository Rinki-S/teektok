package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import teektok.dto.comment.CommentCreateDTO;
import teektok.entity.*;
import teektok.mapper.*;
import teektok.service.BehaviorEventPubliser;
import teektok.service.IBehaviorService;
import teektok.utils.BaseContext;

import java.time.LocalDateTime;

import teektok.VO.CommentVO;
import teektok.VO.PageResult;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.beans.BeanUtils;
import teektok.utils.SyncBufferToDBUtil;

import java.util.stream.Collectors;
import java.util.*;
import java.util.function.Function;

@Service
    public class BehaviorServiceImpl extends ServiceImpl<UserBehaviorMapper, UserBehavior> implements IBehaviorService {
    private static final Logger log = LoggerFactory.getLogger(BehaviorServiceImpl.class);

    @Autowired
    private VideoStatMapper videoStatMapper;
    @Autowired
    private CommentMapper commentMapper;
    @Autowired
    private CommentLikeMapper commentLikeMapper; // 新增
    @Autowired
    private VideoLikeMapper videoLikeMapper;       // 新增
    @Autowired
    private VideoFavoriteMapper videoFavoriteMapper; // 新增
    @Autowired
    private BehaviorEventPubliser eventPublisher;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private SyncBufferToDBUtil syncBufferToDBUtil;
    @Autowired
    private AsyncLogService asyncLogService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    // Redis Key 前缀
    private static final String VIDEO_STAT_KEY = "video:stat:";
    private static final String USER_LIKE_KEY = "user:like:";
    private static final String USER_FAVORITE_KEY = "user:favorite:";
    private static final String USER_COMMENT_KEY = "user:comment:";
    private static final String USER_SHARE_KEY = "user:share:";
    private static final String USER_COMMENT_LIKE_KEY = "user:comment_like:";

    // 行为类型常量 (对应数据库注释)
    private static final int TYPE_PLAY = 1;
    private static final int TYPE_LIKE = 2;
    private static final int TYPE_FAVORITE = 3;
    private static final int TYPE_COMMENT = 4;
    private static final int TYPE_SHARE = 5;

    // 新增缓冲 Key
    private static final String BUFFER_PLAY_KEY = "buffer:video:play";
    private static final String BUFFER_LIKE_KEY = "buffer:video:like";
    private static final String BUFFER_FAVORITE_KEY = "buffer:video:favorite";
    private static final String BUFFER_COMMENT_KEY = "buffer:video:comment";
    private static final String BUFFER_SHARE_KEY = "buffer:video:share";
    private static final String BUFFER_COMMENT_LIKE_KEY = "buffer:co    mment:like";


    @Override
    public void play(Long videoId, Long userId) {
        // 1. Redis计数+1
        redisTemplate.opsForHash().increment(VIDEO_STAT_KEY + videoId, "playCount", 1);

        // 2. 【核心优化】写入 Redis 缓冲 (给数据库同步用)
        // 使用 Hash 结构: Key=BUFFER_PLAY_KEY, Field=videoId, Value=增量
        redisTemplate.opsForHash().increment(BUFFER_PLAY_KEY, videoId.toString(), 1);

        // 3. 异步记录行为流水
        if (userId != null && userId > 0) {
            asyncLogService.saveUserBehavior(userId, videoId, TYPE_PLAY);
        }

        // 4. 发布kafka事件
        if (userId != null) {
//            eventPublisher.publishPlayEvent(videoId, userId);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void like(Long videoId, Long userId) {
        String userLikeKey = USER_LIKE_KEY + userId;

        // 1. Redis 预检查 (防重复)
        // Boolean isMember = redisTemplate.opsForSet().isMember(userLikeKey, videoId.toString());
        // if (Boolean.TRUE.equals(isMember)) {
        //    return;
        // }

        // 2. 插入点赞状态记录 (video_like 表)
        try {
            VideoLike like = new VideoLike();
            like.setUserId(userId);
            like.setVideoId(videoId);
            like.setCreateTime(LocalDateTime.now());
            videoLikeMapper.insert(like);
            // 【同步兜底】直接更新 DB 统计数据，保证数据一致性
            videoStatMapper.incrLikeCount(videoId, 1);
        } catch (Exception e) {
            log.warn("重复点赞 (DB已存在): uid={}, vid={}", userId, videoId);
        }

        // 3. 【暂存】Redis 缓冲计数 (已启用同步更新，暂时注释异步缓冲以防双重计数)
        // redisTemplate.opsForHash().increment(BUFFER_LIKE_KEY, videoId.toString(), 1);

        // 4. 更新 Redis
        redisTemplate.opsForSet().add(userLikeKey, videoId.toString());
        redisTemplate.opsForHash().increment(VIDEO_STAT_KEY + videoId, "likeCount", 1);

        // 5. 异步记录流水
        asyncLogService.saveUserBehavior(userId, videoId, TYPE_LIKE);

        // 6. 发布事件
//        eventPublisher.publishLikeEvent(videoId, userId);
    }


    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unlike(Long videoId, Long userId) {
        // 取消点赞通常不记录在 user_behavior (它是“正向”行为表)，

        String userLikeKey = USER_LIKE_KEY + userId;

        // 1. 删除 DB 中的点赞记录 (同步执行，保证状态强一致性)
        // 使用 LambdaQueryWrapper 构造删除条件
        int rows = videoLikeMapper.delete(new LambdaQueryWrapper<VideoLike>()
                .eq(VideoLike::getVideoId, videoId)
                .eq(VideoLike::getUserId, userId));

        // 只有确实删除了记录（即之前确实点过赞），才进行后续的计数扣减
        if (rows > 0) {
            // 2. 【核心优化】Redis 缓冲计数 -1 (替代 videoStatMapper.incrLikeCount)
            // 写入缓冲，让定时任务去批量扣减 MySQL
            redisTemplate.opsForHash().increment(BUFFER_LIKE_KEY, videoId.toString(), -1);

            // 3. 更新 Redis 缓存状态 (移除 Set 中的 videoId)
            redisTemplate.opsForSet().remove(userLikeKey, videoId.toString());

            // 4. 更新 Redis 实时计数 (给前端展示用，立即 -1)
            redisTemplate.opsForHash().increment(VIDEO_STAT_KEY + videoId, "likeCount", -1);

        } else {
            // 5. 兜底：如果 DB 没删掉记录，但 Redis 可能有脏数据，尝试清理一下
            redisTemplate.opsForSet().remove(userLikeKey, videoId.toString());
        }
    }


    @Override
    @Transactional(rollbackFor = Exception.class)
    public void favorite(Long videoId, Long userId) {
        String userFavKey = USER_FAVORITE_KEY + userId;

        // 1. Redis 预检查 (防重复)
        Boolean isMember = redisTemplate.opsForSet().isMember(userFavKey, videoId.toString());
        if (Boolean.TRUE.equals(isMember)) return;

        // 2. 插入收藏状态记录 (video_favorite 表)
        try {
            VideoFavorite favorite = new VideoFavorite();
            favorite.setUserId(userId);
            favorite.setVideoId(videoId);
            favorite.setCreateTime(LocalDateTime.now());
            videoFavoriteMapper.insert(favorite);

            videoStatMapper.incrCollectCount(videoId, 1);
        } catch (Exception e) {
            // Ignore
            e.printStackTrace();
        }

        // 3. 【核心优化】Redis 缓冲计数 (替代 videoStatMapper.incrFavoriteCount)
        redisTemplate.opsForHash().increment(BUFFER_FAVORITE_KEY, videoId.toString(), 1);

        // 4. 更新 Redis
        redisTemplate.opsForSet().add(userFavKey, videoId.toString());
        redisTemplate.opsForHash().increment(VIDEO_STAT_KEY + videoId, "favoriteCount", 1);

        // 5. 异步记录流水
        asyncLogService.saveUserBehavior(userId, videoId, TYPE_FAVORITE);

        // 6. 发布事件
//        eventPublisher.publishFavoriteEvent(videoId, userId);
    }


    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unfavorite(Long videoId, Long userId) {
        // 取消收藏通常不记录在 user_behavior (它是“正向”行为表)，

        String userFavKey = USER_FAVORITE_KEY + userId;

        // 1. 检查删除记录数
        int rows = videoFavoriteMapper.delete(new LambdaQueryWrapper<VideoFavorite>()
                .eq(VideoFavorite::getVideoId, videoId)
                .eq(VideoFavorite::getUserId, userId));

        // 只有确实删除了记录（即之前确实有收藏），才进行后续的计数扣减
        if (rows > 0) {
            // 2. 【同步更新】直接更新 DB 统计数据
            videoStatMapper.incrCollectCount(videoId, -1);

            // 【暂存】Redis 缓冲计数 -1
            // redisTemplate.opsForHash().increment(BUFFER_FAVORITE_KEY, videoId.toString(), -1);

            // 3. 更新 Redis 缓存状态 (移除 Set 中的 videoId)
            redisTemplate.opsForSet().remove(userFavKey, videoId.toString());

            // 4. 更新 Redis 实时计数 (给前端展示用，立即 -1)
            redisTemplate.opsForHash().increment(VIDEO_STAT_KEY + videoId, "favoriteCount", -1);
        } else {
            // 5. 兜底：如果 DB 没删掉记录，但 Redis 可能有脏数据，尝试清理一下
            redisTemplate.opsForSet().remove(userFavKey, videoId.toString());
        }
    }


    @Override
    @Transactional(rollbackFor = Exception.class)
    public void comment(CommentCreateDTO dto, Long userId) {
        String userCommentKey = USER_COMMENT_KEY + userId;

        // 1. 插入评论
        Comment comment = new Comment();
        comment.setVideoId(dto.getVideoId());
        comment.setUserId(userId);
        comment.setContent(dto.getContent());
        comment.setStatus(0);
        comment.setCreateTime(LocalDateTime.now());
        commentMapper.insert(comment);

        // 2. 【核心优化】Redis 缓冲计数
        redisTemplate.opsForHash().increment(BUFFER_COMMENT_KEY, dto.getVideoId().toString(), 1);

        // 3. 更新redis缓存状态
        redisTemplate.opsForSet().add(userCommentKey, dto.getVideoId().toString());
        redisTemplate.opsForHash().increment(VIDEO_STAT_KEY + dto.getVideoId(), "commentCount", 1);

        // 4. 异步记录流水
        asyncLogService.saveUserBehavior(userId, dto.getVideoId(), TYPE_COMMENT);

        // 5. 发布事件
//        eventPublisher.publishCommentEvent(dto.getVideoId(), userId, dto.getContent());
    }

    @Override
    public void share(Long videoId, Long userId) {
        // 1. 【核心优化】Redis 缓冲计数
        redisTemplate.opsForHash().increment(BUFFER_SHARE_KEY, videoId.toString(), 1);

        // 2. 更新redis缓存状态
        redisTemplate.opsForHash().increment(VIDEO_STAT_KEY + videoId, "shareCount", 1);

        // 3. 记录行为流水 (行为类型 5)
        if (userId != null && userId > 0) {
            asyncLogService.saveUserBehavior(userId, videoId, TYPE_SHARE);
        }

        // 4. 发布事件
//        eventPublisher.publishShareEvent(videoId, userId);
    }


    @Override
    public PageResult<CommentVO> listComments(Long videoId, int page, int size) {
        // 1. 分页查询评论
        Page<Comment> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Comment> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Comment::getVideoId, videoId)
                .orderByDesc(Comment::getLikeCount) // 按热度（点赞数）排序
                .orderByDesc(Comment::getCreateTime);

        Page<Comment> commentPage = commentMapper.selectPage(pageParam, queryWrapper);

        if (commentPage.getRecords().isEmpty()) {
            return new PageResult<>(new ArrayList<>(), commentPage.getTotal());
        }

        // 2. 收集 ID
        List<Comment> records = commentPage.getRecords();
        Set<Long> userIds = records.stream()
                .map(Comment::getUserId)
                .collect(Collectors.toSet());
        List<String> commentIdsStr = records.stream()
                .map(c -> c.getId().toString())
                .collect(Collectors.toList());

        // 3. 批量查询用户信息
        Map<Long, User> userMap = Collections.emptyMap();
        if (!userIds.isEmpty()) {
            List<User> users = userMapper.selectBatchIds(userIds);
            userMap = users.stream().collect(Collectors.toMap(User::getId, Function.identity()));
        }

        // 4. 【优化】判断是否点赞 (优先查 Redis Set)
        Set<Long> likedCommentIds = new HashSet<>();
        Long currentUserId = BaseContext.getCurrentId();

        if (currentUserId != null) {
            String userCommentLikeKey = USER_COMMENT_LIKE_KEY + currentUserId;
            // 既然我们在 like/unlike 时维护了 Redis Set，这里可以直接利用
            // 检查当前页的 commentIds 有哪些在这个 Set 里
            List<Object> isMembers = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
                for (String cid : commentIdsStr) {
                    connection.sIsMember(userCommentLikeKey.getBytes(), cid.getBytes());
                }
                return null;
            });

            // 解析 Pipeline 结果
            for (int i = 0; i < records.size(); i++) {
                if (isMembers.get(i) instanceof Boolean && (Boolean) isMembers.get(i)) {
                    likedCommentIds.add(records.get(i).getId());
                }
            }
        }

        // 5. 组装 VO
        List<CommentVO> voList = new ArrayList<>();
        for (Comment comment : records) {
            CommentVO vo = new CommentVO();
            BeanUtils.copyProperties(comment, vo);

            // 填充点赞信息
            vo.setLikeCount(comment.getLikeCount() == null ? 0 : comment.getLikeCount());
            vo.setIsLiked(likedCommentIds.contains(comment.getId()));
            vo.setParentId(comment.getParentId());

            User user = userMap.get(comment.getUserId());
            if (user != null) {
                vo.setUsername(user.getUsername());
                vo.setAvatar(user.getAvatar());
            } else {
                vo.setUsername("用户" + comment.getUserId());
            }
            voList.add(vo);
        }

        return new PageResult<>(voList, commentPage.getTotal());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void likeComment(Long commentId, Long userId) {
        String userCommentLikeKey = USER_COMMENT_LIKE_KEY + userId;

        // 1. Redis 预检查 (防重复)
        // 这一步能拦截绝大多数重复点击，减轻 DB 压力
        Boolean isMember = redisTemplate.opsForSet().isMember(userCommentLikeKey, commentId.toString());
        if (Boolean.TRUE.equals(isMember)) {
            return;
        }

        // 2. 插入点赞记录 (同步写 DB，保证状态强一致性)
        try {
            CommentLike like = new CommentLike();
            like.setUserId(userId);
            like.setCommentId(commentId);
            like.setCreateTime(LocalDateTime.now());
            commentLikeMapper.insert(like);
        } catch (Exception e) {
            // 唯一索引冲突，说明库里已经有了，忽略
            log.warn("评论重复点赞: uid={}, cid={}", userId, commentId);
            return;
        }

        // 3. 【核心优化】Redis 缓冲计数 +1
        // 替代原有的 commentMapper.incrLikeCount(commentId, 1);
        redisTemplate.opsForHash().increment(BUFFER_COMMENT_LIKE_KEY, commentId.toString(), 1);

        // 4. 更新 Redis 状态 (记录该用户点赞了这个评论)
        redisTemplate.opsForSet().add(userCommentLikeKey, commentId.toString());

        // 注意：评论列表通常没有像 Video 那样单独的 Cached 实体，
        // 所以这里不需要像 video 那样去 update "video:stat:id"。
        // 前端展示的计数在 listComments 里处理。
    }

    @Override
    public void unlikeComment(Long commentId, Long userId) {
        String userCommentLikeKey = USER_COMMENT_LIKE_KEY + userId;

        // 1. 删除 DB 记录 (同步)
        int rows = commentLikeMapper.delete(new LambdaQueryWrapper<CommentLike>()
                .eq(CommentLike::getCommentId, commentId)
                .eq(CommentLike::getUserId, userId));

        if (rows > 0) {
            // 2. 【核心优化】Redis 缓冲计数 -1
            redisTemplate.opsForHash().increment(BUFFER_COMMENT_LIKE_KEY, commentId.toString(), -1);

            // 3. 移除 Redis 状态
            redisTemplate.opsForSet().remove(userCommentLikeKey, commentId.toString());
        } else {
            // 兜底清理
            redisTemplate.opsForSet().remove(userCommentLikeKey, commentId.toString());
        }
    }

    // ================= 私有辅助方法 =================
    private void initVideoStat(Long videoId) {
        try {
            VideoStat stat = new VideoStat();
            stat.setVideoId(videoId);
            videoStatMapper.insert(stat);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 定时将 Redis 中的播放量、点赞量等缓冲数据同步到 MySQL
     * 每 5 秒执行一次
     */
    @Scheduled(fixedRate = 5000)
    public void syncVideoStatsToDB() {
        log.info("开始同步视频统计数据...");
        try { syncBufferToDBUtil.syncBufferToDB(BUFFER_PLAY_KEY, "play_count"); } catch (Exception e) { log.error("同步播放数失败", e); }
        try { syncBufferToDBUtil.syncBufferToDB(BUFFER_LIKE_KEY, "like_count"); } catch (Exception e) { log.error("同步点赞数失败", e); }
        try { syncBufferToDBUtil.syncBufferToDB(BUFFER_FAVORITE_KEY, "favorite_count"); } catch (Exception e) { log.error("同步收藏数失败", e); }
        try { syncBufferToDBUtil.syncBufferToDB(BUFFER_COMMENT_KEY, "comment_count"); } catch (Exception e) { log.error("同步评论数失败", e); }
        try { syncBufferToDBUtil.syncBufferToDB(BUFFER_SHARE_KEY, "share_count"); } catch (Exception e) { log.error("同步分享数失败", e); }

        // 【新增】同步评论点赞数
        try { syncCommentLikesToDB(); } catch (Exception e) { log.error("同步评论点赞数失败", e); }
    }

    /**
     * 专门用于同步评论点赞数的方法
     */
    private void syncCommentLikesToDB() {
        // 1. 取出缓冲
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(BUFFER_COMMENT_LIKE_KEY);
        if (entries.isEmpty()) return;

        // 2. 清除 Redis
        redisTemplate.delete(BUFFER_COMMENT_LIKE_KEY);

        // 3. 转换数据
        Map<Long, Integer> updateMap = new HashMap<>();
        entries.forEach((k, v) -> {
            try {
                updateMap.put(Long.valueOf(k.toString()), Integer.valueOf(v.toString()));
            } catch (Exception e) { /* ignore */ }
        });

        // 4. 调用 CommentMapper 进行批量更新
        if (!updateMap.isEmpty()) {
            commentMapper.batchUpdateLikeCount(updateMap);
            log.info("同步评论点赞数据完成，条数: {}", updateMap.size());
        }
    }
}
