package teektok.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import teektok.service.IRecommendEngine;

import java.util.List;

@Slf4j
@Service
public class SimpleRecommendEngine implements IRecommendEngine {
    @Override
    public List<Long> recommendHotVideoIds() {
        // TODO：按播放数/点赞数排序
        return List.of(1L, 2L, 3L);
    }

    @Override
    public List<Long> recommendPersonalVideoIds(Long userId) {
        // TODO：基于用户行为做简单推荐
        return List.of(4L, 5L, 6L);
    }
}
