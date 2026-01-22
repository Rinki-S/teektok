package teektok.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import teektok.dto.analysis.VideoAnalysisVO;
import teektok.mapper.VideoStatMapper;
import teektok.service.IAnalysisService;

@Service
public class AnalysisServiceImpl implements IAnalysisService {

    @Autowired
    private VideoStatMapper videoStatMapper;

    @Override
    public VideoAnalysisVO getVideoAnalysis() {
        VideoAnalysisVO vo = videoStatMapper.sumAll();
        if (vo == null) {
            vo = new VideoAnalysisVO();
            vo.setPlayCount(0L);
            vo.setLikeCount(0L);
            vo.setCommentCount(0L);
        }
        return vo;
    }
}
