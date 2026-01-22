package teektok.service;

import teektok.dto.recommend.RecommendVideoVO;

import java.util.List;

public interface IRecommendService {
    /**
     * 获取推荐视频流
     * @param userId 当前用户ID (游客传 null 或 0)
     * @param page 页码
     * @param size 每页大小
     * @param refresh 刷新标记（非空则绕过缓存，允许每次触底拿到不同结果）
     * @return 组装好的视频卡片列表
     */
    List<RecommendVideoVO> getPersonalRecommendFeed(Long userId, int page, int size, Long refresh);

    /**
     * 获取热门视频流
     * @param page 页码
     * @param size 每页大小
     * @param refresh 刷新标记（可用于变化起始位置）
     * @return 组装好的视频卡片列表
     */
    List<RecommendVideoVO> getHotRecommendFeed(Long userId, int page, int size, Long refresh);
}
