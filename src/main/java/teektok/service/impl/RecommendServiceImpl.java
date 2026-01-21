package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import teektok.dto.recommend.RecommendVideoVO;
import teektok.entity.RecommendationResult;
import teektok.entity.User;
import teektok.entity.Video;
import teektok.entity.VideoStat;
import teektok.mapper.RecommendationResultMapper;
import teektok.mapper.UserMapper;
import teektok.mapper.VideoMapper;
import teektok.mapper.VideoStatMapper;
import teektok.service.IRecommendService;


import java.util.*;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 推荐服务实现类
 */
@Slf4j
@Service
public class RecommendServiceImpl implements IRecommendService {

    @Autowired
    private RecommendationResultMapper recommendationMapper;
    @Autowired
    private VideoMapper videoMapper;
    @Autowired
    private VideoStatMapper videoStatMapper;
    @Autowired
    private UserMapper userMapper;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String REDIS_KEY_PREFIX = "user:recommend:v2:";

    @Override
    public List<RecommendVideoVO> getPersonalRecommendFeed(Long userId, int page, int size) {
        // 定义缓存 Key，区分登录用户和游客，以及页码
        String cacheKey = REDIS_KEY_PREFIX + (userId == null ? "guest" : userId) + ":" + page;

        // ================== 1. 查询 Redis 缓存 ==================
        //优先从redis中查询推荐列表
        try {
            // 尝试从缓存获取
            List<RecommendVideoVO> cachedList = (List<RecommendVideoVO>) redisTemplate.opsForValue().get(cacheKey);
            if (cachedList != null && !cachedList.isEmpty()) {
                log.info("推荐接口命中缓存: {}", cacheKey);
                return cachedList;
            }
        } catch (Exception e) {
            // 缓存挂了不能影响主业务，记录日志即可
            log.error("Redis 读取异常", e);
        }

        // ================== 2. 查询 MySQL  ==================
        // 计算分页 offset
        int offset = (page - 1) * size;
        String limitSql = "LIMIT " + offset + ", " + size;

        // 1. 获取推荐的 Video ID 列表
        List<Long> videoIds = Collections.emptyList();

        if (userId != null && userId > 0) {
            List<RecommendationResult> results = null;
            try {
                // 2. 进行实时推荐查询
                // 登录用户：查推荐表 (按分数倒序)
                results = recommendationMapper.selectList(
                        new LambdaQueryWrapper<RecommendationResult>()
                                .eq(RecommendationResult::getUserId, userId)
                                .eq(RecommendationResult::getType, "REALTIME")
                                .orderByDesc(RecommendationResult::getScore)
                                .last(limitSql)
                );
            } catch (Exception e) {
                System.err.println("[RECOMMEND] 实时推荐查询失败: " + e.getMessage());
                results = null;
            }

            if (results == null || results.isEmpty()) {
                try {
                    //获取离线推荐
                    results = recommendationMapper.selectList(
                            new LambdaQueryWrapper<RecommendationResult>()
                                    .eq(RecommendationResult::getUserId, userId)
                                    .eq(RecommendationResult::getType, "OFFLINE")
                                    .orderByDesc(RecommendationResult::getScore)
                                    .last(limitSql)
                    );
                } catch (Exception e) {
                    System.err.println("[RECOMMEND] 离线推荐查询失败: " + e.getMessage());
                    results = Collections.emptyList();
                }
            }

            // 提取视频ID
            videoIds = results.stream()
                    .map(RecommendationResult::getMovieId)
                    .collect(Collectors.toList());
        }

        // 3. 兜底策略 (冷启动)：如果没查到 ID，或者是游客，则查最新/热门视频
        if (videoIds.isEmpty()) {
            List<Video> fallbackVideos = videoMapper.selectList(
                    new LambdaQueryWrapper<Video>()
                            .eq(Video::getIsHot, 1) // 如果有热门字段可开启
                            .eq(Video::getIsDeleted, 0) // 必须是未删除的
                            .orderByDesc(Video::getCreateTime) // 按时间倒序
                            .last(limitSql)
            );
            videoIds = fallbackVideos.stream().map(Video::getId).collect(Collectors.toList());
        }

        if (videoIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 3. 核心步骤：数据聚合 (Data Aggregation)
        List<RecommendVideoVO> resultList = buildVOs(videoIds);

        // ================== 3. 写入 Redis 缓存 ==================
        if (!resultList.isEmpty()) {
            try {
                // 存入缓存，设置过期时间 (例如 10 分钟)，防止推荐内容长时间不更新
                redisTemplate.opsForValue().set(cacheKey, resultList, 10, TimeUnit.MINUTES);
                log.info("推荐结果已写入缓存: {}", cacheKey);
            } catch (Exception e) {
                log.error("Redis 写入异常", e);
            }
        }

        // 拿着 ID 列表，批量去查 Video表、User表、Stat表，然后在内存里组装
        return resultList;
    }

    @Override
    public List<RecommendVideoVO> getHotRecommendFeed(int page, int size) {
        // 1. 获取推荐的 Video ID 列表
        List<Long> videoIds = Collections.emptyList();

        int offset = (page - 1) * size;
        String limitSql = "LIMIT " + offset + ", " + size;

        // 2.查视频表(取is_hot=1)
        List<Video> result = videoMapper.selectList(
                new LambdaQueryWrapper<Video>()
                        .eq(Video::getIsHot, 1)
                        .eq(Video::getIsDeleted, 0)
                        .orderByDesc(Video::getCreateTime)
                        .last(limitSql)
        );

        //3. 提取视频ID列表
        videoIds = result.stream().map(Video::getId).collect(Collectors.toList());

        // 4. 核心步骤：数据聚合 (Data Aggregation)
        return buildVOs(videoIds);
    }

    /**
     * 内部辅助方法：根据 ID 列表组装完整数据
     */
    private List<RecommendVideoVO> buildVOs(List<Long> videoIds) {
        if (videoIds == null || videoIds.isEmpty()) {
            return Collections.emptyList();
        }

        // A. 批量查视频基本信息
        List<Video> videos = videoMapper.selectBatchIds(videoIds);
        Map<Long, Video> videoMap = videos.stream()
                .collect(Collectors.toMap(Video::getId, Function.identity()));

        // B. 批量查作者信息
        List<Long> uploaderIds = videos.stream()
                .map(Video::getUploaderId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, User> userMap = uploaderIds.isEmpty()
                ? Collections.emptyMap()
                : userMapper.selectBatchIds(uploaderIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        // C. 批量查统计信息 (点赞/评论数)
        List<VideoStat> stats = videoStatMapper.selectBatchIds(videoIds);
        Map<Long, VideoStat> statMap = stats.stream()
                .collect(Collectors.toMap(VideoStat::getVideoId, Function.identity()));

        // D. 组装最终结果
        List<RecommendVideoVO> voList = new ArrayList<>();
        // 注意：这里按传入的 videoIds 顺序遍历，保证推荐算法的排序不乱
        for (Long vid : videoIds) {
            Video video = videoMap.get(vid);
            if (video == null) continue; // 可能视频被删了但推荐表里还有

            RecommendVideoVO vo = new RecommendVideoVO();
            // 基础信息
            vo.setId(video.getId());
            vo.setTitle(video.getTitle());
            vo.setVideoUrl(video.getVideoUrl());
            vo.setCoverUrl(video.getCoverUrl());
            vo.setDescription(video.getDescription());

            User uploader = video.getUploaderId() == null ? null : userMap.get(video.getUploaderId());
            vo.setUploaderId(video.getUploaderId());
            if (uploader != null) {
                vo.setUploaderName(uploader.getUsername());
                vo.setUploaderAvatar(uploader.getAvatar());
            }

            // 统计信息
            VideoStat stat = statMap.get(vid);
            if (stat != null) {
                vo.setLikeCount(stat.getLikeCount());
                vo.setCommentCount(stat.getCommentCount());
                vo.setFavoriteCount(stat.getFavoriteCount());
                vo.setShareCount(stat.getShareCount());
            } else {
                vo.setLikeCount(0L);
                vo.setCommentCount(0L);
                vo.setShareCount(0L);
            }

            voList.add(vo);
        }
        return voList;
    }
}
