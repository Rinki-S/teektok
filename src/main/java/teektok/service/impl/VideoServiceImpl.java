package teektok.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import teektok.VO.PageResult;
import teektok.dto.behavior.PlayDTO;
import teektok.dto.recommend.RecommendVideoVO;
import teektok.dto.video.VideoListVO;
import teektok.dto.video.VideoQueryDTO;
import teektok.dto.video.VideoUploadDTO;
import teektok.dto.video.VideoVO;
import teektok.entity.Video;
import teektok.mapper.VideoMapper;
import teektok.service.IVideoService;
import teektok.utils.AliyunOSSOperator;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class VideoServiceImpl extends ServiceImpl<VideoMapper, Video> implements IVideoService {

    @Autowired
    private AliyunOSSOperator aliyunOSSOperator;

    @Override
    public void upload(VideoUploadDTO videoUploadDTO, Long uploaderId) throws Exception {
        if(videoUploadDTO.getFile()==null||videoUploadDTO.getFile().isEmpty()){
            throw new RuntimeException("上传视频不能为空");
        }

        String url;

        try {
            url= aliyunOSSOperator.upload(videoUploadDTO.getFile().getBytes(),videoUploadDTO.getFile().getOriginalFilename());
        } catch (Exception e) {
            throw new RuntimeException("上传视频失败");
        }

        //获取视频封面的url
        String coverUrl=url+"?x-oss-process=video/snapshot,t_1000,f_jpg,w_0,h_0,m_fast";

        //将视频元数据保存到数据库
        Video video=new Video();
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

        Page<Video> page = new Page<>(dto.getPage(), dto.getSize());

        Page<Video> result = (Page<Video>) this.page(page);

        List<VideoVO> list = result.getRecords().stream()
                .map(this::toVO)
                .toList();

        return new PageResult<>(list, result.getTotal());
    }

    private VideoVO toVO(Video video) {
        VideoVO vo = new VideoVO();
        vo.setVideoId(video.getId());
        vo.setTitle(video.getTitle());
//        vo.setPlayCount(video.getPlayCount());
//        vo.setLikeCount(video.getLikeCount());
        return vo;
    }

    @Override
    public void play(PlayDTO playDTO) {

    }

    @Override
    public List<RecommendVideoVO> getVideoRecommendVOs(List<Long> videoIds) {
        return List.of();
    }
}
