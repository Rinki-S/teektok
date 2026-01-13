package teektok.service;

import java.util.List;

public interface IRecommendEngine {
    /**
     * 热门视频推荐
     */
    List<Long> recommendHotVideoIds();

    /**
     * 个性化视频推荐
     */
    List<Long> recommendPersonalVideoIds(Long userId);
}
