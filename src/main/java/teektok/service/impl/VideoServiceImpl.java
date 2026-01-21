package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import teektok.VO.PageResult;
import teektok.dto.behavior.PlayDTO;
import teektok.dto.recommend.RecommendVideoVO;
import teektok.dto.video.VideoListVO;
import teektok.dto.video.VideoQueryDTO;
import teektok.dto.video.VideoUploadDTO;
import teektok.dto.video.VideoVO;
import teektok.entity.User;
import teektok.entity.UserBehavior;
import teektok.entity.Video;
import teektok.entity.VideoFavorite;
import teektok.entity.VideoLike;
import teektok.entity.VideoStat;
import teektok.entity.Relation;
import teektok.mapper.UserBehaviorMapper;
import teektok.mapper.UserMapper;
import teektok.mapper.VideoFavoriteMapper;
import teektok.mapper.VideoLikeMapper;
import teektok.mapper.VideoMapper;
import teektok.mapper.VideoStatMapper;
import teektok.mapper.RelationMapper;
import teektok.service.IUserService;
import teektok.service.IVideoService;
import teektok.utils.AliyunOSSOperator;
import teektok.utils.BaseContext;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class VideoServiceImpl extends ServiceImpl<VideoMapper, Video> implements IVideoService {

    @Autowired
    private AliyunOSSOperator aliyunOSSOperator;
    @Autowired
    private VideoStatMapper videoStatMapper;
    @Autowired
    private UserBehaviorMapper userBehaviorMapper;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private VideoLikeMapper videoLikeMapper;
    @Autowired
    private VideoFavoriteMapper videoFavoriteMapper;
    @Autowired
    private RelationMapper relationMapper;
    @Autowired
    private IUserService userService;
    @Autowired
    @Qualifier("commonExecutor") // 引用 ThreadPoolConfig 中的 bean
    private Executor commonExecutor;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // Redis Key 常量 (需与 BehaviorService 保持一致)
    private static final String VIDEO_STAT_KEY = "video:stat:";
    private static final String USER_LIKE_KEY = "user:like:";
    private static final String USER_FAVORITE_KEY = "user:favorite:";
    private static final String USER_FOLLOW_KEY = "user:follow:"; // 假设关注也做了缓存

    @Override
    public void upload(VideoUploadDTO videoUploadDTO,Long uploaderId) throws Exception {
        if (videoUploadDTO.getFile() == null || videoUploadDTO.getFile().isEmpty()) {
            throw new RuntimeException("上传视频不能为空");
        }

        String url;

        try {
            // 传递 contentType
            url = aliyunOSSOperator.upload(
                videoUploadDTO.getFile().getBytes(), 
                videoUploadDTO.getFile().getOriginalFilename(),
                videoUploadDTO.getFile().getContentType()
            );
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("上传视频失败", e);
        }

        //获取视频封面的url
        String coverUrl = url + "?x-oss-process=video/snapshot,t_1000,f_jpg,w_0,h_0,m_fast";

        //将视频元数据保存到数据库
        Video video = new Video();
        video.setTitle(videoUploadDTO.getTitle());
        video.setVideoUrl(url);
        video.setCoverUrl(coverUrl);
        video.setDescription(videoUploadDTO.getDescription());
        video.setUploaderId(uploaderId);
        video.setStatus(0);
        video.setCreateTime(LocalDateTime.now());
        video.setUpdateTime(LocalDateTime.now());

        this.save(video);

        // 初始化视频统计数据
        VideoStat stat = new VideoStat();
        stat.setVideoId(video.getId());
        stat.setPlayCount(0L);
        stat.setLikeCount(0L);
        stat.setCommentCount(0L);
        stat.setShareCount(0L);
        stat.setFavoriteCount(0L);
        videoStatMapper.insert(stat);

        // 【优化】预热 Redis 统计数据
        // 上传完立刻把 0 写进 Redis，这样用户刷到时直接读 Redis，不用回源 DB
        Map<String, Object> map = new HashMap<>();
        map.put("playCount", 0);
        map.put("likeCount", 0);
        map.put("commentCount", 0);
        map.put("shareCount", 0);
        map.put("favoriteCount", 0);
        redisTemplate.opsForHash().putAll(VIDEO_STAT_KEY + video.getId(), map);
        redisTemplate.expire(VIDEO_STAT_KEY + video.getId(), 24, TimeUnit.HOURS);
    }

    @Override
    public PageResult<VideoVO> list(VideoQueryDTO dto) {
        int current = (dto.getPage() != null) ? dto.getPage() : 1;
        int size = (dto.getSize() != null) ? dto.getSize() : 10;
        Page<Video> page = new Page<>(current, size);

        // 1. 分页查 DB (只查 Video 主表)
        LambdaQueryWrapper<Video> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.orderByDesc(Video::getCreateTime);
        this.page(page, queryWrapper);

        if (page.getRecords().isEmpty()) {
            return new PageResult<>(Collections.emptyList(), page.getTotal());
        }

        Long currentUserId = BaseContext.getCurrentId();

        // 2. 【补全逻辑】批量查询“是否关注作者” (复用原本的数据库查询逻辑)
        // 这一步是为了保证 isFollowed 字段不为空
        Set<Long> followedUploaderIds = new HashSet<>();
        if (currentUserId != null) {
            // 提取当前页所有作者ID
            List<Long> uploaderIds = page.getRecords().stream()
                    .map(Video::getUploaderId)
                    .distinct() // 去重
                    .collect(Collectors.toList());

            if (!uploaderIds.isEmpty()) {
                List<Relation> relations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                        .eq(Relation::getUserId, currentUserId)
                        .in(Relation::getTargetId, uploaderIds));
                followedUploaderIds = relations.stream()
                        .map(Relation::getTargetId)
                        .collect(Collectors.toSet());
            }
        }

        // 3. 组装 VO
        Set<Long> finalFollowedUploaderIds = followedUploaderIds; // Lambda 需要 final 变量
        List<VideoVO> voList = page.getRecords().stream().map(video -> {
            VideoVO vo = toVO(video);

            // A. 填充用户信息 (走 Redis 缓存)
            User user = userService.getUserCached(video.getUploaderId());
            if (user != null) {
                vo.setUploaderName(user.getUsername());
                vo.setUploaderAvatar(user.getAvatar());
            }

            // B. 填充统计数据 (走 Redis 计数，比数据库更实时)
            fillVideoStatsFromRedis(vo);

            // C. 填充互动状态
            if (currentUserId != null) {
                // 判断点赞 (查 Redis Set)
                vo.setIsLiked(Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(USER_LIKE_KEY + currentUserId, video.getId().toString())));
                // 判断收藏 (查 Redis Set)
                vo.setIsFavorited(Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(USER_FAVORITE_KEY + currentUserId, video.getId().toString())));
                // 判断关注 (查刚刚的 DB 结果)
                vo.setIsFollowed(finalFollowedUploaderIds.contains(video.getUploaderId()));
            } else {
                // 未登录状态全部为 false
                vo.setIsLiked(false);
                vo.setIsFavorited(false);
                vo.setIsFollowed(false);
            }
            return vo;
        }).collect(Collectors.toList());

        return new PageResult<>(voList, page.getTotal());
    }

    private VideoVO toVO(Video video) {
        VideoVO vo = new VideoVO();
        vo.setVideoId(video.getId());
        vo.setTitle(video.getTitle());
        vo.setVideoUrl(video.getVideoUrl());
        vo.setCoverUrl(video.getCoverUrl());
        vo.setDescription(video.getDescription());
        vo.setUploaderId(video.getUploaderId());
        return vo;
    }

    @Override
    public List<RecommendVideoVO> getVideoRecommendVOs(List<Long> videoIds) {
        return List.of();
    }

    @Override
    public VideoVO getDetail(Long videoId) {
        // 1. 查询视频实体(主键查询，速度快，暂不需要优化)
        Video video = this.getById(videoId);
        if (video == null) {
            throw new RuntimeException("视频不存在");
        }

        // 2. 转换 VO
        VideoVO vo = toVO(video);

        // 3. 【优化】填充用户信息 (走 Redis 缓存)
        User user = userService.getUserCached(video.getUploaderId());
        if (user != null) {
            vo.setUploaderName(user.getUsername());
            vo.setUploaderAvatar(user.getAvatar());
        } else {
            // 缓存穿透或用户不存在时的兜底
            vo.setUploaderName("未知用户");
        }

        // 4. 【优化】填充统计数据 (走 Redis，确保与列表页数据一致)
        fillVideoStatsFromRedis(vo);

        // 5. 【优化】填充互动状态 (Redis > DB)
        Long currentUserId = BaseContext.getCurrentId();

        if (currentUserId != null) {
            // A. 点赞状态：查 Redis Set
            // 注意：Redis Set 中存的是 String 类型的 videoId
            Boolean isLiked = redisTemplate.opsForSet().isMember(USER_LIKE_KEY + currentUserId, videoId.toString());
            vo.setIsLiked(Boolean.TRUE.equals(isLiked));

            // B. 收藏状态：查 Redis Set
            Boolean isFavorited = redisTemplate.opsForSet().isMember(USER_FAVORITE_KEY + currentUserId, videoId.toString());
            vo.setIsFavorited(Boolean.TRUE.equals(isFavorited));

            // C. 关注状态：目前维持查 DB (因为 Relation 模块尚未实现纯 Redis 缓存)
            // 单次主键/索引查询性能尚可
            boolean isFollowed = relationMapper.exists(new LambdaQueryWrapper<Relation>()
                    .eq(Relation::getUserId, currentUserId)
                    .eq(Relation::getTargetId, video.getUploaderId()));
            vo.setIsFollowed(isFollowed);
        } else {
            // 未登录全部为 false
            vo.setIsLiked(false);
            vo.setIsFavorited(false);
            vo.setIsFollowed(false);
        }

        return vo;
    }

    @Override
    public PageResult<VideoVO> getLikedVideos(Long userId, int page, int size) {
        // 1. 分页查询 video_like 表
        Page<VideoLike> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<VideoLike> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(VideoLike::getUserId, userId)
                .orderByDesc(VideoLike::getCreateTime);
        Page<VideoLike> likePage = videoLikeMapper.selectPage(pageParam, queryWrapper);

        List<Long> videoIds = likePage.getRecords().stream().map(VideoLike::getVideoId).toList();
        if (videoIds.isEmpty()) {
            return new PageResult<>(Collections.emptyList(), likePage.getTotal());
        }

        // 2. 复用逻辑：根据 videoIds 查询视频详情并组装 VO
        // 这里我们可以复用一个私有方法，但为了简单起见，这里直接查询
        return buildVideoVOs(videoIds, likePage.getTotal());
    }

    @Override
    public PageResult<VideoVO> getFavoritedVideos(Long userId, int page, int size) {
        // 1. 分页查询 video_favorite 表
        Page<VideoFavorite> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<VideoFavorite> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(VideoFavorite::getUserId, userId)
                .orderByDesc(VideoFavorite::getCreateTime);
        Page<VideoFavorite> favoritePage = videoFavoriteMapper.selectPage(pageParam, queryWrapper);

        List<Long> videoIds = favoritePage.getRecords().stream().map(VideoFavorite::getVideoId).toList();
        if (videoIds.isEmpty()) {
            return new PageResult<>(Collections.emptyList(), favoritePage.getTotal());
        }

        return buildVideoVOs(videoIds, favoritePage.getTotal());
    }

    private PageResult<VideoVO> buildVideoVOs(List<Long> videoIds, long total) {
        // 1. 批量查询视频
        List<Video> videos = this.listByIds(videoIds);
        // 保持顺序：因为 listByIds 不保证顺序，我们需要按 videoIds 的顺序排序
        Map<Long, Video> videoMap = videos.stream().collect(Collectors.toMap(Video::getId, Function.identity()));
        
        List<Video> orderedVideos = videoIds.stream()
                .map(videoMap::get)
                .filter(java.util.Objects::nonNull)
                .toList();

        if (orderedVideos.isEmpty()) {
            return new PageResult<>(Collections.emptyList(), total);
        }

        // 2. 提取 uploaderIds
        List<Long> uploaderIds = orderedVideos.stream().map(Video::getUploaderId).distinct().toList();
        Map<Long, User> userMap = Collections.emptyMap();;
        if (!uploaderIds.isEmpty()) {
            // 这里也可以优化为循环调用 userService.getUserCached，但批量查库通常性能可以接受
            userMap = userMapper.selectBatchIds(uploaderIds).stream().collect(Collectors.toMap(User::getId, Function.identity()));
        }

        // 3. 【优化】批量从 Redis 获取统计数据 (Pipeline)
        Map<Long, VideoStat> statMap = batchGetVideoStatsFromRedis(videoIds);

        // 4. 【优化】批量从 Redis 获取交互状态 (Pipeline)
        Long currentUserId = BaseContext.getCurrentId();
        Map<Long, Boolean> likedMap = new HashMap<>();
        Map<Long, Boolean> favoritedMap = new HashMap<>();
        
        if (currentUserId != null) {
            likedMap = batchGetInteractionStatus(USER_LIKE_KEY + currentUserId, videoIds);
            favoritedMap = batchGetInteractionStatus(USER_FAVORITE_KEY + currentUserId, videoIds);
        }

        // 5 批量查询关注状态
        // 关注关系较复杂，暂维持查库，或者需要 RelationService 提供 Redis 接口
        Set<Long> followedUploaderIds = new HashSet<>();
        if (currentUserId != null && !uploaderIds.isEmpty()) {
            List<Relation> relations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                    .eq(Relation::getUserId, currentUserId)
                    .in(Relation::getTargetId, uploaderIds));
            followedUploaderIds = relations.stream().map(Relation::getTargetId).collect(Collectors.toSet());
        }

        // 5. 组装 VO
        Map<Long, User> finalUserMap = userMap;
        Map<Long, Boolean> finalLikedMap = likedMap;
        Map<Long, Boolean> finalFavoritedMap = favoritedMap;
        Set<Long> finalFollowedUploaderIds = followedUploaderIds;

        List<VideoVO> voList = orderedVideos.stream().map(video -> {
            VideoVO vo = toVO(video);

            // 用户
            User user = finalUserMap.get(video.getUploaderId());
            if (user != null) {
                vo.setUploaderName(user.getUsername());
                vo.setUploaderAvatar(user.getAvatar());
            }

            // 视频数据统计 (来自 Redis)
            VideoStat stat = statMap.get(video.getId());
            if (stat != null) {
                vo.setPlayCount(stat.getPlayCount());
                vo.setLikeCount(stat.getLikeCount());
                vo.setCommentCount(stat.getCommentCount());
                vo.setShareCount(stat.getShareCount());
                vo.setFavoriteCount(stat.getFavoriteCount());
            } else {
                vo.setPlayCount(0L); vo.setLikeCount(0L); vo.setCommentCount(0L); vo.setShareCount(0L); vo.setFavoriteCount(0L);
            }

            // 用户与视频交互状态
            vo.setIsLiked(finalLikedMap.getOrDefault(video.getId(), false));
            vo.setIsFavorited(finalFavoritedMap.getOrDefault(video.getId(), false));
            vo.setIsFollowed(finalFollowedUploaderIds.contains(video.getUploaderId()));

            return vo;
        }).toList();

        return new PageResult<>(voList, total);
    }

    // ================= 辅助方法: Pipeline 批量读取 =================
    /**
     * 【最终版】批量从 Redis 获取视频统计数据
     * 策略：Cache Aside + 异步预热
     * 1. 命中缓存：直接返回
     * 2. 未命中：主线程返回 0 (保证响应速度)，异步线程查 DB 并回写 Redis
     */
    private Map<Long, VideoStat> batchGetVideoStatsFromRedis(List<Long> videoIds) {
        if (videoIds.isEmpty()) return Collections.emptyMap();

        //使用executePipelined批量从redis中读取视频数据统计表的value到results中
        List<Object> results = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (Long vid : videoIds) {
                String key = VIDEO_STAT_KEY + vid;
                connection.hGetAll(key.getBytes());
            }
            return null;
        });

        //根据videoIds进行遍历，将数据写进Map<Long, VideoStat>
        Map<Long, VideoStat> resultMap = new HashMap<>();
        List<Long> missIds = new ArrayList<>(); // 记录 Redis 里没有的 ID

        for (int i = 0; i < videoIds.size(); i++) {
            Long vid = videoIds.get(i);
            Object res = results.get(i);

            if (res instanceof Map && !((Map<?, ?>) res).isEmpty()) {
                // 命中：解析数据
                Map<String, Object> hash = (Map<String, Object>) res;
                VideoStat stat = new VideoStat();
                stat.setVideoId(vid);
                stat.setPlayCount(getLong(hash.get("playCount")));
                stat.setLikeCount(getLong(hash.get("likeCount")));
                stat.setCommentCount(getLong(hash.get("commentCount")));
                stat.setShareCount(getLong(hash.get("shareCount")));
                stat.setFavoriteCount(getLong(hash.get("favoriteCount")));
                resultMap.put(vid, stat);
            } else {
                // 未命中：加入待查列表
                missIds.add(vid);

                // 【关键】主线程先给个“假”数据 (0)，保证不报错、不阻塞
                VideoStat zeroStat = new VideoStat();
                zeroStat.setVideoId(vid);
                zeroStat.setPlayCount(0L); zeroStat.setLikeCount(0L);
                zeroStat.setCommentCount(0L); zeroStat.setShareCount(0L); zeroStat.setFavoriteCount(0L);
                resultMap.put(vid, zeroStat);
            }
        }

        // 2. 异步处理未命中的数据 (Fire-and-Forget)
        if (!missIds.isEmpty()) {
            CompletableFuture.runAsync(() -> {
                try {
                    // A. 查 DB (耗时操作，现在在子线程里，不影响主接口响应)
                    List<VideoStat> dbStats = videoStatMapper.selectBatchIds(missIds);

                    if (dbStats != null && !dbStats.isEmpty()) {
                        // B. 回写 Redis
                        redisTemplate.executePipelined(new org.springframework.data.redis.core.SessionCallback<Object>() {
                            @Override
                            public Object execute(org.springframework.data.redis.core.RedisOperations operations) {
                                for (VideoStat stat : dbStats) {
                                    String key = VIDEO_STAT_KEY + stat.getVideoId();
                                    Map<String, Object> map = new HashMap<>();
                                    map.put("playCount", stat.getPlayCount());
                                    map.put("likeCount", stat.getLikeCount());
                                    map.put("commentCount", stat.getCommentCount());
                                    map.put("shareCount", stat.getShareCount());
                                    map.put("favoriteCount", stat.getFavoriteCount());

                                    operations.opsForHash().putAll(key, map);
                                    operations.expire(key, 24, TimeUnit.HOURS);
                                }
                                return null;
                            }
                        });
                        log.info("异步预热完成，更新了 {} 个视频的统计数据", dbStats.size());
                    }
                } catch (Exception e) {
                    log.error("异步预热统计数据失败", e);
                }
            }, commonExecutor); // 使用你的线程池
        }

        return resultMap;
    }

    /**
     * 使用 Redis Pipeline 批量检查 Set 成员 (用于点赞/收藏状态)
     */
    private Map<Long, Boolean> batchGetInteractionStatus(String key, List<Long> videoIds) {
        if (videoIds.isEmpty()) return Collections.emptyMap();

        //使用executePipelined批量查询
        List<Object> results = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (Long vid : videoIds) {
                connection.sIsMember(key.getBytes(), vid.toString().getBytes());
            }
            return null;
        });

        Map<Long, Boolean> map = new HashMap<>();
        for (int i = 0; i < videoIds.size(); i++) {
            Object res = results.get(i);
            map.put(videoIds.get(i), res instanceof Boolean && (Boolean) res);
        }
        return map;
    }

    // ================= 辅助方法: 从redis中读取统计数据 =================
    /**
     * 【核心】从 Redis 读取统计数据，如果没有则查 DB 并回写
     */
    private void fillVideoStatsFromRedis(VideoVO vo) {
        String key = VIDEO_STAT_KEY + vo.getVideoId();
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);

        //写入VideoVO
        if (!entries.isEmpty()) {
            vo.setPlayCount(getLong(entries.get("playCount")));
            vo.setLikeCount(getLong(entries.get("likeCount")));
            vo.setCommentCount(getLong(entries.get("commentCount")));
            vo.setShareCount(getLong(entries.get("shareCount")));
            vo.setFavoriteCount(getLong(entries.get("favoriteCount")));
        } else {
            // 若redis中无记录，回源 DB
            VideoStat stat = videoStatMapper.selectById(vo.getVideoId());
            if (stat != null) {
                vo.setPlayCount(stat.getPlayCount());
                vo.setLikeCount(stat.getLikeCount());
                vo.setCommentCount(stat.getCommentCount());
                vo.setShareCount(stat.getShareCount());
                vo.setFavoriteCount(stat.getFavoriteCount());

                // 回写 Redis (过期时间 24小时)
                Map<String, Object> map = new HashMap<>();
                map.put("playCount", stat.getPlayCount());
                map.put("likeCount", stat.getLikeCount());
                map.put("commentCount", stat.getCommentCount());
                map.put("shareCount", stat.getShareCount());
                map.put("favoriteCount", stat.getFavoriteCount());
                redisTemplate.opsForHash().putAll(key, map);
                redisTemplate.expire(key, 24, TimeUnit.HOURS);
            }
        }
    }

    private Long getLong(Object obj) {
        if (obj == null) return 0L;
        try {
            return Long.valueOf(obj.toString());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
