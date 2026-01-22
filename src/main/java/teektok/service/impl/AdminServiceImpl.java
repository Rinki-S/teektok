package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import teektok.VO.PageResult;
import teektok.dto.audit.AdminLoginDTO;
import teektok.dto.audit.AdminLoginVO;
import teektok.dto.audit.AdminVideoVO;
import teektok.dto.audit.VideoAuditDTO;
import teektok.entity.Admin;
import teektok.entity.User;
import teektok.entity.Video;
import teektok.entity.VideoStat;
import teektok.mapper.AdminMapper;
import teektok.mapper.UserMapper;
import teektok.mapper.VideoMapper;
import teektok.mapper.VideoStatMapper;
import teektok.service.IAdminService;
import teektok.utils.JwtUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AdminServiceImpl extends ServiceImpl<AdminMapper, Admin> implements IAdminService {
    @Autowired
    private UserMapper userMapper; // 需要操作用户表

    @Autowired
    private VideoMapper videoMapper; // 需要操作视频表

    @Autowired
    private VideoStatMapper videoStatMapper; // 需要操作视频统计数据表

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // 定义 Key 前缀 (需与 User/Video 模块保持一致)
    private static final String USER_INFO_KEY = "user:info:";
    private static final String VIDEO_INFO_KEY = "video:info:";
    private static final String VIDEO_STAT_KEY = "video:stat:";
    private static final String RECOMMEND_HOT_KEY = "recommend:hot"; // 假设热门推荐有缓存 Key

    @Override
    public AdminLoginVO login(AdminLoginDTO dto) {
        // 1. 查管理员用户
        Admin admin = this.getOne(new LambdaQueryWrapper<Admin>()
                .eq(Admin::getUsername, dto.getUsername()));

        if (admin == null) {
            throw new RuntimeException("管理员不存在"); // 管理员不存在
        }

        // 2. 校验密码 (明文比对，生产环境建议用 BCrypt)
        if (!admin.getPassword().equals(dto.getPassword())) {
            throw new RuntimeException("密码错误"); // 密码错误
        }

        // 3. 生成 Token
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", admin.getId());
        claims.put("role", "admin");
        String token = JwtUtils.createToken(claims);

        // 4. 返回
        AdminLoginVO vo = new AdminLoginVO();
        vo.setToken(token);
        return vo;
    }

    @Override
    public void ChangeUserStatus(Long userId, Integer status) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        user.setStatus(status);
        userMapper.updateById(user);

        redisTemplate.delete(USER_INFO_KEY + userId);
    }

    @Override
    public void auditVideo(VideoAuditDTO dto) {
        Video video = videoMapper.selectById(dto.getVideoId());
        if (video == null) {
            throw new RuntimeException("视频不存在");
        }

        if (Objects.equals(dto.getStatus(), 1)) {
            video.setStatus(1);
        } else {
            video.setStatus(2);
        }

        videoMapper.updateById(video);

        // 【关键修复】删除视频详情缓存
        redisTemplate.delete(VIDEO_INFO_KEY + dto.getVideoId());

        // 如果审核不通过，可能还需要从热门列表、推荐列表中移除 (看业务需求)
        if (dto.getStatus() != 1) {
            // 清理热门缓存，让下次请求重新构建
            redisTemplate.delete(RECOMMEND_HOT_KEY);
        }
    }

    @Override
    public void setHotVideo(Long videoId, Boolean hot) {
        Video video = videoMapper.selectById(videoId);
        if (video == null) {
            throw new RuntimeException("视频不存在");
        }

        // 使用 UpdateWrapper 只更新 is_hot 字段，效率更高
        LambdaUpdateWrapper<Video> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Video::getId, videoId)
                .set(Video::getIsHot, hot ? 1 : 0);

        videoMapper.update(null, updateWrapper);

        // 【关键修复】
        // 1. 删除单体视频缓存 (更新 isHot 字段)
        redisTemplate.delete(VIDEO_INFO_KEY + videoId);

        // 2. 这里的操作直接影响“热门推荐列表”，必须清理热门列表缓存
        // 假设 RecommendService 用了这个 Key 缓存 List<Video>
        // 删除后，RecommendService 下次会查 DB 重新计算
        redisTemplate.delete("recommend:hot:ids"); // 对应 RecommendServiceImpl 里的 Key
    }

    @Override
    public void deleteVideo(Long videoId) {
        // 1. 检查视频是否存在
        Video video = videoMapper.selectById(videoId);
        if (video == null) {
            throw new RuntimeException("视频不存在");
        }

        // 2. 删除视频主表数据
        videoMapper.deleteById(videoId);

        // 3. 删除视频统计表数据 (VideoStat)
        videoStatMapper.deleteById(videoId);

        // 4. 如果有“热门列表”缓存，也要清理，防止列表里还能刷出这个已删视频
        redisTemplate.delete("recommend:hot:ids");

        // 5. 【新增】删除 Redis 中的视频详情缓存
        // 这样下次 getDetail 会查库，发现没了，然后缓存“空对象”
        redisTemplate.delete("video:info:" + videoId);
    }

    @Override
    public PageResult<User> getUserList(Integer page, Integer pageSize) {
        // 1. 创建 MyBatis-Plus 分页对象
        Page<User> pageInfo = new Page<>(page, pageSize);

        // 2. 执行查询
        userMapper.selectPage(pageInfo, null);

        // 3. 封装为项目通用的 PageResult 并返回
        return new PageResult<>(pageInfo.getRecords(), pageInfo.getTotal());
    }

    @Override
    public PageResult<AdminVideoVO> getVideoList(Integer page, Integer pageSize, Integer status, Integer isHot) {
        try {
            Page<Video> pageInfo = new Page<>(page, pageSize);

            LambdaQueryWrapper<Video> wrapper = new LambdaQueryWrapper<>();
            if (status != null) {
                wrapper.eq(Video::getStatus, status);
            }
            if (isHot != null) {
                wrapper.eq(Video::getIsHot, isHot);
            }
            wrapper.orderByDesc(Video::getCreateTime);

            videoMapper.selectPage(pageInfo, wrapper);

            List<Video> videos = pageInfo.getRecords();
            if (videos == null || videos.isEmpty()) {
                return new PageResult<>(List.of(), pageInfo.getTotal());
            }

            Set<Long> videoIds = videos.stream().map(Video::getId).collect(Collectors.toSet());
            List<VideoStat> stats = videoIds.isEmpty() ? List.of() : videoStatMapper.selectBatchIds(videoIds);
            Map<Long, VideoStat> statMap = stats.stream()
                    .filter(Objects::nonNull)
                    .filter(s -> s.getVideoId() != null)
                    .collect(Collectors.toMap(VideoStat::getVideoId, s -> s, (a, b) -> a));

            List<AdminVideoVO> list = videos.stream().map(v -> {
                AdminVideoVO vo = new AdminVideoVO();
                vo.setVideoId(v.getId());
                vo.setTitle(v.getTitle());
                vo.setVideoUrl(v.getVideoUrl());
                vo.setCoverUrl(v.getCoverUrl());
                vo.setDescription(v.getDescription());
                vo.setUploaderId(v.getUploaderId());
                vo.setStatus(v.getStatus());
                vo.setIsHot(v.getIsHot());
                vo.setIsDeleted(v.getIsDeleted());
                vo.setCreateTime(v.getCreateTime());
                vo.setUpdateTime(v.getUpdateTime());

                VideoStat st = statMap.get(v.getId());
                if (st != null) {
                    vo.setPlayCount(st.getPlayCount());
                    vo.setLikeCount(st.getLikeCount());
                    vo.setCommentCount(st.getCommentCount());
                    vo.setShareCount(st.getShareCount());
                    vo.setFavoriteCount(st.getFavoriteCount());
                } else {
                    vo.setPlayCount(0L);
                    vo.setLikeCount(0L);
                    vo.setCommentCount(0L);
                    vo.setShareCount(0L);
                    vo.setFavoriteCount(0L);
                }

                return vo;
            }).collect(Collectors.toList());

            return new PageResult<>(list, pageInfo.getTotal());
        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg == null || msg.isBlank()) msg = e.getClass().getSimpleName();
            throw new RuntimeException("获取视频列表失败: " + msg, e);
        }
    }

    @Override
    public AdminVideoVO getVideoDetail(Long videoId) {
        Video video = videoMapper.selectById(videoId);
        if (video == null) {
            throw new RuntimeException("视频不存在");
        }
        VideoStat stat = videoStatMapper.selectById(videoId);

        AdminVideoVO vo = new AdminVideoVO();
        vo.setVideoId(video.getId());
        vo.setTitle(video.getTitle());
        vo.setVideoUrl(video.getVideoUrl());
        vo.setCoverUrl(video.getCoverUrl());
        vo.setDescription(video.getDescription());
        vo.setUploaderId(video.getUploaderId());
        vo.setStatus(video.getStatus());
        vo.setIsHot(video.getIsHot());
        vo.setIsDeleted(video.getIsDeleted());
        vo.setCreateTime(video.getCreateTime());
        vo.setUpdateTime(video.getUpdateTime());

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

        return vo;
    }
}
