package teektok.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import teektok.dto.recommend.RecommendVideoVO;
import teektok.service.IRecommendEngine;
import teektok.service.IRecommendService;
import teektok.service.IVideoService;

import java.util.List;

@Slf4j
@Service
public class RecommendServiceImpl implements IRecommendService {
    private final IRecommendEngine recommendEngine;
    private final IVideoService videoService;

    public RecommendServiceImpl(IRecommendEngine recommendEngine, IVideoService videoService) {
        this.recommendEngine = recommendEngine;
        this.videoService = videoService;
    }


    @Override
    public List<RecommendVideoVO> getHotVideos() {
        List<Long> videoIds = recommendEngine.recommendHotVideoIds();

        return videoService.getVideoRecommendVOs(videoIds);
    }

    @Override
    public List<RecommendVideoVO> getPersonalVideos(Long userId) {
        List<Long> videoIds = recommendEngine.recommendPersonalVideoIds(userId);

        return videoService.getVideoRecommendVOs(videoIds);
    }
}
