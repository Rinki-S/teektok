package teektok.service.impl;

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
import teektok.entity.UserBehavior;
import teektok.entity.Video;
import teektok.entity.VideoStat;
import teektok.mapper.UserBehaviorMapper;
import teektok.mapper.VideoMapper;
import teektok.mapper.VideoStatMapper;
import teektok.service.IVideoService;
import teektok.utils.AliyunOSSOperator;
import teektok.utils.BaseContext;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
    }

    @Override
    public PageResult<VideoVO> list(VideoQueryDTO dto) {

        // 设置分页参数,默认值：page=1, size=10
        int current = (dto.getPage() != null) ? dto.getPage() : 1;
        int size = (dto.getSize() != null) ? dto.getSize() : 10;
        Page<Video> page = new Page<>(current, size);

        // 执行分页查询
        this.lambdaQuery().orderByDesc(Video::getCreateTime).page(page);
        //提取所有视频id
        List<Long> videoIds = page.getRecords().stream()
                .map(Video::getId)
                .toList();

        // 3. 批量查询统计数据 (VideoStat 表) -> SELECT * FROM video_stat WHERE video_id IN (...)
        List<VideoStat> stats = videoStatMapper.selectBatchIds(videoIds);
        // 4. 将统计数据转为 Map，key 是 videoId，value 是 VideoStat 对象，方便后续查找
        Map<Long, VideoStat> statMap = stats.stream()
                .collect(Collectors.toMap(VideoStat::getVideoId, Function.identity()));
        // 5. 组装数据
        List<VideoVO> voList = page.getRecords().stream().map(video -> {
            VideoVO vo = toVO(video);

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
}
