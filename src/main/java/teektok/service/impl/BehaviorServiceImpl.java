package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.conditions.query.LambdaQueryChainWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import teektok.dto.comment.CommentCreateDTO;
import teektok.entity.*;
import teektok.mapper.*;
import teektok.service.BehaviorEventPubliser;
import teektok.service.IBehaviorService;

import java.time.LocalDateTime;

import teektok.VO.CommentVO;
import teektok.VO.PageResult;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.beans.BeanUtils;
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
    private VideoLikeMapper videoLikeMapper;       // 新增
    @Autowired
    private VideoFavoriteMapper videoFavoriteMapper; // 新增
    @Autowired
    private BehaviorEventPubliser eventPublisher;
    @Autowired
    private UserBehaviorMapper userBehaviorMapper;
    @Autowired
    private UserMapper userMapper;

    @Override
    public void play(Long videoId, Long userId) {
        // 1. 检查视频是否存在
        boolean exists = videoStatMapper.exists(new LambdaQueryWrapper<VideoStat>()
                .eq(VideoStat::getVideoId, videoId));
        if (!exists) {
            //插入视频记录
            VideoStat videoStat = new VideoStat();
            videoStat.setVideoId(videoId);
            videoStatMapper.insert(videoStat);
        }

        // 2. 原子更新：播放数 +1
        // 优化：直接调用 Mapper 的原子方法，无需手写 setSql
        videoStatMapper.incrPlayCount(videoId, 1);

        // 3. 发布播放事件
//        eventPublisher.publishPlayEvent(videoId, userId);
    }

    @Override
    public void like(Long videoId, Long userId) {
        // 1. 查是否存在
        boolean exists = videoLikeMapper.exists(new LambdaQueryWrapper<VideoLike>()
                .eq(VideoLike::getVideoId, videoId)
                .eq(VideoLike::getUserId, userId));

        if (!exists) {
            // 2. 插入点赞记录
            VideoLike like = new VideoLike();
            like.setUserId(userId);
            like.setVideoId(videoId);
            like.setCreateTime(LocalDateTime.now());
            videoLikeMapper.insert(like);

            // 3. 统计数 +1
            // 优化：使用 Mapper 方法
            videoStatMapper.incrLikeCount(videoId, 1);

            // 4. 发布事件
//            eventPublisher.publishLikeEvent(videoId, userId);
        }
    }

    @Override
    public void unlike(Long videoId, Long userId) {
        // 1. 检查记录是否存在
        boolean exists = videoLikeMapper.exists(new LambdaQueryWrapper<VideoLike>()
                .eq(VideoLike::getVideoId, videoId)
                .eq(VideoLike::getUserId, userId));

        if (!exists) {
            throw new RuntimeException("点赞记录不存在");
        }

        // 2. 删除记录
        int rows = videoLikeMapper.delete(new LambdaQueryWrapper<VideoLike>()
                .eq(VideoLike::getVideoId, videoId)
                .eq(VideoLike::getUserId, userId));

        if (rows > 0) {
            // 3. 统计数 -1
            // 优化：传入 -1 实现减少
            videoStatMapper.incrLikeCount(videoId, -1);

            // 4. 发布事件 (通常 unlike 也可以发事件，用于撤回推荐权重)
//            eventPublisher.publishUnlikeEvent(videoId, userId);
        }
    }

    @Override
    public void favorite(Long videoId, Long userId) {
        // 1. 查是否存在
        boolean exists = videoFavoriteMapper.exists(new LambdaQueryWrapper<VideoFavorite>()
                .eq(VideoFavorite::getVideoId, videoId)
                .eq(VideoFavorite::getUserId, userId));

        if (!exists) {
            // 2. 插入收藏记录
            VideoFavorite favorite = new VideoFavorite();
            favorite.setUserId(userId);
            favorite.setVideoId(videoId);
            favorite.setCreateTime(LocalDateTime.now());
            videoFavoriteMapper.insert(favorite);

            // 3. 统计数 +1
            // 优化：使用 Mapper 方法 (注意 Mapper 里叫 incrCollectCount)
            videoStatMapper.incrCollectCount(videoId, 1);

            // 4. 发布事件
//            eventPublisher.publishFavoriteEvent(videoId, userId);
        }
    }

    @Override
    public void unfavorite(Long videoId, Long userId) {
        // 1. 查是否存在
        boolean exists = videoFavoriteMapper.exists(new LambdaQueryWrapper<VideoFavorite>()
                .eq(VideoFavorite::getVideoId, videoId)
                .eq(VideoFavorite::getUserId, userId));
        if (!exists) {
            throw new RuntimeException("收藏记录不存在");
        }

        // 2. 删除记录
        int rows = videoFavoriteMapper.delete(new LambdaQueryWrapper<VideoFavorite>()
                .eq(VideoFavorite::getVideoId, videoId)
                .eq(VideoFavorite::getUserId, userId));

        if (rows > 0) {
            // 3. 统计数 -1
            // 优化：传入 -1
            videoStatMapper.incrCollectCount(videoId, -1);

            // 4. 发布事件
//            eventPublisher.publishUnfavoriteEvent(videoId, userId);
        }
    }


    @Override
    public void comment(CommentCreateDTO dto, Long userId) {
        // 1. 插入评论
        Comment comment = new Comment();
        comment.setVideoId(dto.getVideoId());
        comment.setUserId(userId);
        comment.setContent(dto.getContent());
        comment.setStatus(0);
        comment.setCreateTime(LocalDateTime.now());
        commentMapper.insert(comment);

        // 2. 统计数 +1
        // 优化：使用 Mapper 方法
        videoStatMapper.incrCommentCount(dto.getVideoId(), 1);

        // 3. 发布事件
//        eventPublisher.publishCommentEvent(dto.getVideoId(), userId, dto.getContent());
    }

    @Override
    public PageResult<CommentVO> listComments(Long videoId, int page, int size) {
        // 1. 分页查询评论
        Page<Comment> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Comment> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Comment::getVideoId, videoId)
                .orderByDesc(Comment::getCreateTime);

        Page<Comment> commentPage = commentMapper.selectPage(pageParam, queryWrapper);

        List<CommentVO> voList = new ArrayList<>();
        if (commentPage.getRecords().isEmpty()) {
            return new PageResult<>(voList, commentPage.getTotal());
        }

        // 2. 收集用户ID
        Set<Long> userIds = commentPage.getRecords().stream()
                .map(Comment::getUserId)
                .collect(Collectors.toSet());

        // 3. 批量查询用户
        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<User> users = userMapper.selectBatchIds(userIds);
            userMap = users.stream().collect(Collectors.toMap(User::getId, Function.identity()));
        }

        // 4. 组装 VO
        for (Comment comment : commentPage.getRecords()) {
            CommentVO vo = new CommentVO();
            BeanUtils.copyProperties(comment, vo);

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
    public void share(Long videoId, Long userId) {
        // 1. 统计数 +1
        // 优化：使用 Mapper 方法
        videoStatMapper.incrShareCount(videoId, 1);

        // 2. 发布事件
//        eventPublisher.publishShareEvent(videoId, userId);
    }
}
