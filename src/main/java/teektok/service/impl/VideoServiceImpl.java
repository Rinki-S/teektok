package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
import teektok.service.IVideoService;
import teektok.utils.AliyunOSSOperator;
import teektok.utils.BaseContext;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    }

    @Override
    public PageResult<VideoVO> list(VideoQueryDTO dto) {

        // 设置分页参数,默认值：page=1, size=10
        int current = (dto.getPage() != null) ? dto.getPage() : 1;
        int size = (dto.getSize() != null) ? dto.getSize() : 10;
        Page<Video> page = new Page<>(current, size);

        LambdaQueryWrapper<Video> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.orderByDesc(Video::getCreateTime);

        // 执行分页查询，此时 MyBatis-Plus 会将 count 结果写回 page 对象
        this.page(page, queryWrapper);
        //提取所有视频id
        List<Long> videoIds = page.getRecords().stream()
                .map(Video::getId)
                .toList();

        // 提取所有上传者ID
        List<Long> uploaderIds = page.getRecords().stream()
                .map(Video::getUploaderId)
                .distinct()
                .toList();
        
        // 批量查询用户信息
        Map<Long, User> userMap;
        if (!uploaderIds.isEmpty()) {
            List<User> users = userMapper.selectBatchIds(uploaderIds);
            userMap = users.stream().collect(Collectors.toMap(User::getId, Function.identity()));
        } else {
            userMap = Collections.emptyMap();
        }

        // 3. 批量查询统计数据 (VideoStat 表) -> SELECT * FROM video_stat WHERE video_id IN (...)
        List<VideoStat> stats = videoIds.isEmpty() ? Collections.emptyList() : videoStatMapper.selectBatchIds(videoIds);
        // 4. 将统计数据转为 Map，key 是 videoId，value 是 VideoStat 对象，方便后续查找
        Map<Long, VideoStat> statMap = stats.stream()
                .collect(Collectors.toMap(VideoStat::getVideoId, Function.identity()));

        Long currentUserId = BaseContext.getCurrentId();
        Set<Long> tempLikedVideoIds;
        if (currentUserId != null && !videoIds.isEmpty()) {
            List<VideoLike> likes = videoLikeMapper.selectList(new LambdaQueryWrapper<VideoLike>()
                    .eq(VideoLike::getUserId, currentUserId)
                    .in(VideoLike::getVideoId, videoIds));
            tempLikedVideoIds = likes.stream().map(VideoLike::getVideoId).collect(Collectors.toSet());
        } else {
            tempLikedVideoIds = Collections.emptySet();
        }
        Set<Long> likedVideoIds = tempLikedVideoIds;

        // 4.5 批量查询收藏状态
        Set<Long> tempFavoritedVideoIds;
        if (currentUserId != null && !videoIds.isEmpty()) {
            List<VideoFavorite> favorites = videoFavoriteMapper.selectList(new LambdaQueryWrapper<VideoFavorite>()
                    .eq(VideoFavorite::getUserId, currentUserId)
                    .in(VideoFavorite::getVideoId, videoIds));
            tempFavoritedVideoIds = favorites.stream().map(VideoFavorite::getVideoId).collect(Collectors.toSet());
        } else {
            tempFavoritedVideoIds = Collections.emptySet();
        }
        Set<Long> favoritedVideoIds = tempFavoritedVideoIds;

        // 4.6 批量查询关注状态
        Set<Long> tempFollowedUploaderIds;
        if (currentUserId != null && !uploaderIds.isEmpty()) {
            List<Relation> relations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                    .eq(Relation::getUserId, currentUserId)
                    .in(Relation::getTargetId, uploaderIds));
            tempFollowedUploaderIds = relations.stream().map(Relation::getTargetId).collect(Collectors.toSet());
        } else {
            tempFollowedUploaderIds = Collections.emptySet();
        }
        Set<Long> followedUploaderIds = tempFollowedUploaderIds;

        // 5. 组装数据
        List<VideoVO> voList = page.getRecords().stream().map(video -> {
            VideoVO vo = toVO(video);
            
            // 填充用户信息
            User user = userMap.get(video.getUploaderId());
            if (user != null) {
                vo.setUploaderName(user.getUsername());
                vo.setUploaderAvatar(user.getAvatar());
            } else {
                log.warn("Video {} has uploaderId {} but user not found in map", video.getId(), video.getUploaderId());
            }

            // 从 Map 中获取对应的统计数据
            VideoStat stat = statMap.get(video.getId());
            if (stat != null) {
                vo.setPlayCount(stat.getPlayCount());
                vo.setLikeCount(stat.getLikeCount());
                vo.setCommentCount(stat.getCommentCount());
                vo.setShareCount(stat.getShareCount());
                vo.setFavoriteCount(stat.getFavoriteCount());
            } else {
                // 如果没有统计数据，给默认值 0
                vo.setPlayCount(0L);
                vo.setLikeCount(0L);
                vo.setCommentCount(0L);
                vo.setShareCount(0L);
                vo.setFavoriteCount(0L);
            }
            vo.setIsLiked(likedVideoIds.contains(video.getId()));
            vo.setIsFavorited(favoritedVideoIds.contains(video.getId()));
            vo.setIsFollowed(followedUploaderIds.contains(video.getUploaderId()));
            return vo;
        }).toList();
        // 返回分页结果
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

    /*@Override
    @Transactional
    public void play(PlayDTO playDTO) {
        // 1. 记录用户播放行为
        UserBehavior behavior = new UserBehavior();
        behavior.setVideoId(playDTO.getVideoId());
        behavior.setUserId(BaseContext.getCurrentId()); // 实际开发中应从上下文获取当前登录用户ID
        behavior.setBehaviorType(1); // 假设 1 代表播放行为
        behavior.setCreateTime(LocalDateTime.now());
        userBehaviorMapper.insert(behavior);

        // 2. 更新视频统计数据 (播放量 +1)
        // 使用 MyBatis-Plus 的 update 语句直接在数据库层面 +1，避免并发竞争问题
        videoStatMapper.update(null, new LambdaUpdateWrapper<VideoStat>()
                .eq(VideoStat::getVideoId, playDTO.getVideoId())
                .setSql("play_count = play_count + 1"));
    }*/

    @Override
    public List<RecommendVideoVO> getVideoRecommendVOs(List<Long> videoIds) {
        return List.of();
    }

    @Override
    public VideoVO getDetail(Long videoId) {
        // 1. 查询视频实体
        Video video = this.getById(videoId);
        if (video == null) {
            throw new RuntimeException("视频不存在");
        }
        // 2. 转换 VO
        VideoVO vo = toVO(video);

        // 填充用户信息
        User user = userMapper.selectById(video.getUploaderId());
        if (user != null) {
            vo.setUploaderName(user.getUsername());
            vo.setUploaderAvatar(user.getAvatar());
        } else {
            log.warn("Video {} has uploaderId {} but user not found in DB", videoId, video.getUploaderId());
        }

        // 3. 补充统计数据
        VideoStat stat = videoStatMapper.selectById(videoId);
        if (stat != null) {
            vo.setPlayCount(stat.getPlayCount());
            vo.setLikeCount(stat.getLikeCount());
            vo.setCommentCount(stat.getCommentCount());
            vo.setShareCount(stat.getShareCount());
            vo.setFavoriteCount(stat.getFavoriteCount());
        } else {
            vo.setPlayCount(0L);
            vo.setLikeCount(0L);
            vo.setCommentCount(0L);
            vo.setShareCount(0L);
            vo.setFavoriteCount(0L);
        }

        Long currentUserId = BaseContext.getCurrentId();
        boolean isLiked = false;
        boolean isFavorited = false;
        boolean isFollowed = false;
        if (currentUserId != null) {
            isLiked = videoLikeMapper.exists(new LambdaQueryWrapper<VideoLike>()
                    .eq(VideoLike::getUserId, currentUserId)
                    .eq(VideoLike::getVideoId, videoId));
            isFavorited = videoFavoriteMapper.exists(new LambdaQueryWrapper<VideoFavorite>()
                    .eq(VideoFavorite::getUserId, currentUserId)
                    .eq(VideoFavorite::getVideoId, videoId));
            isFollowed = relationMapper.exists(new LambdaQueryWrapper<Relation>()
                    .eq(Relation::getUserId, currentUserId)
                    .eq(Relation::getTargetId, video.getUploaderId()));
        }
        vo.setIsLiked(isLiked);
        vo.setIsFavorited(isFavorited);
        vo.setIsFollowed(isFollowed);
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
        Map<Long, User> userMap;
        if (!uploaderIds.isEmpty()) {
            userMap = userMapper.selectBatchIds(uploaderIds).stream().collect(Collectors.toMap(User::getId, Function.identity()));
        } else {
            userMap = Collections.emptyMap();
        }

        // 3. 批量查询统计数据
        List<VideoStat> stats = videoStatMapper.selectBatchIds(videoIds);
        Map<Long, VideoStat> statMap = stats.stream().collect(Collectors.toMap(VideoStat::getVideoId, Function.identity()));

        // 4. 批量查询当前用户的点赞/收藏状态
        Long currentUserId = BaseContext.getCurrentId();
        Set<Long> tempLikedVideoIds;
        Set<Long> tempFavoritedVideoIds;
        
        if (currentUserId != null) {
             List<VideoLike> likes = videoLikeMapper.selectList(new LambdaQueryWrapper<VideoLike>()
                    .eq(VideoLike::getUserId, currentUserId)
                    .in(VideoLike::getVideoId, videoIds));
            tempLikedVideoIds = likes.stream().map(VideoLike::getVideoId).collect(Collectors.toSet());

            List<VideoFavorite> favorites = videoFavoriteMapper.selectList(new LambdaQueryWrapper<VideoFavorite>()
                    .eq(VideoFavorite::getUserId, currentUserId)
                    .in(VideoFavorite::getVideoId, videoIds));
            tempFavoritedVideoIds = favorites.stream().map(VideoFavorite::getVideoId).collect(Collectors.toSet());
        } else {
            tempLikedVideoIds = Collections.emptySet();
            tempFavoritedVideoIds = Collections.emptySet();
        }
        Set<Long> likedVideoIds = tempLikedVideoIds;
        Set<Long> favoritedVideoIds = tempFavoritedVideoIds;

        // 4.5 批量查询关注状态
        Set<Long> tempFollowedUploaderIds;
        if (currentUserId != null && !uploaderIds.isEmpty()) {
            List<Relation> relations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                    .eq(Relation::getUserId, currentUserId)
                    .in(Relation::getTargetId, uploaderIds));
            tempFollowedUploaderIds = relations.stream().map(Relation::getTargetId).collect(Collectors.toSet());
        } else {
            tempFollowedUploaderIds = Collections.emptySet();
        }
        Set<Long> followedUploaderIds = tempFollowedUploaderIds;

        // 5. 组装 VO
        List<VideoVO> voList = orderedVideos.stream().map(video -> {
            VideoVO vo = toVO(video);
            
            User user = userMap.get(video.getUploaderId());
            if (user != null) {
                vo.setUploaderName(user.getUsername());
                vo.setUploaderAvatar(user.getAvatar());
            }

            VideoStat stat = statMap.get(video.getId());
            if (stat != null) {
                vo.setPlayCount(stat.getPlayCount());
                vo.setLikeCount(stat.getLikeCount());
                vo.setCommentCount(stat.getCommentCount());
                vo.setShareCount(stat.getShareCount());
                vo.setFavoriteCount(stat.getFavoriteCount());
            } else {
                vo.setPlayCount(0L);
                vo.setLikeCount(0L);
                vo.setCommentCount(0L);
                vo.setShareCount(0L);
                vo.setFavoriteCount(0L);
            }
            vo.setIsLiked(likedVideoIds.contains(video.getId()));
            vo.setIsFavorited(favoritedVideoIds.contains(video.getId()));
            vo.setIsFollowed(followedUploaderIds.contains(video.getUploaderId()));
            return vo;
        }).toList();

        return new PageResult<>(voList, total);
    }
}
