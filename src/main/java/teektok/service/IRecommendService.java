package teektok.service;

import teektok.dto.recommend.RecommendVideoVO;

import java.util.List;

public interface IRecommendService {
    /**
     * 获取热门视频
     */
    List<RecommendVideoVO> getHotVideos();

    /**
     * 获取个性化推荐视频
     */
    List<RecommendVideoVO> getPersonalVideos(Long userId);
}
