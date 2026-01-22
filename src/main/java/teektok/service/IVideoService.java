package teektok.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import teektok.VO.PageResult;
import teektok.dto.behavior.PlayDTO;
import teektok.dto.recommend.RecommendVideoVO;
import teektok.dto.video.VideoListVO;
import teektok.dto.video.VideoQueryDTO;
import teektok.dto.video.VideoUploadDTO;
import teektok.dto.video.VideoVO;
import teektok.entity.User;

import java.util.List;

public interface IVideoService {
    /*
     * 上传短视频
     * */
    String upload(VideoUploadDTO videoUploadDTO,Long uploaderId) throws Exception;

    /*
     * 获取视频列表(分页)
     * */
    PageResult<VideoVO> list(VideoQueryDTO videoQueryDTO);

    /**
     * 获取视频详情
     */
    VideoVO getDetail(Long videoId);

    /*
     * 播放视频（记录播放行为）
     * *//*
    void play(PlayDTO playDTO);*/

    /**
     * 根据视频 ID 列表，获取推荐展示用的视频信息
     */
    List<RecommendVideoVO> getVideoRecommendVOs(List<Long> videoIds);

    /**
     * 获取用户点赞的视频列表
     */
    PageResult<VideoVO> getLikedVideos(Long userId, int page, int size);

    /**
     * 获取用户收藏的视频列表
     */
    PageResult<VideoVO> getFavoritedVideos(Long userId, int page, int size);

    /**
     * 获取当前用户上传的视频列表
     */
    PageResult<VideoVO> getMyVideos(Long userId, int page, int size);

    /**
     * 获取当前用户观看历史（按最近观看时间倒序）
     */
    PageResult<VideoVO> getHistoryVideos(Long userId, int page, int size);

    /**
     * 清空当前用户观看历史
     */
    void clearHistory(Long userId);

    /**
     * 删除当前用户某个视频的观看历史
     */
    void deleteHistoryVideo(Long userId, Long videoId);

}
