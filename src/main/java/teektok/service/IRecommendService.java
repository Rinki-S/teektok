package teektok.service;

import teektok.dto.recommend.RecommendVideoVO;

import java.util.List;

public interface IRecommendService {
    /**
     * 获取推荐视频流
     * @param userId 当前用户ID (游客传 null 或 0)
     * @return 组装好的视频卡片列表
     */
    List<RecommendVideoVO> getPersonalRecommendFeed(Long userId);

    /**
     * 获取热门视频流
     * @return 组装好的视频卡片列表
     */
    List<RecommendVideoVO> getHotRecommendFeed(Long userId);
}
