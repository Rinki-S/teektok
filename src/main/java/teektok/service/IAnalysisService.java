package teektok.service;

import teektok.dto.analysis.VideoAnalysisVO;

public interface IAnalysisService {
    /**
     * 获取视频全站行为统计数据
     * (播放数、点赞数、评论数等)
     * @return 统计结果 VO
     */
    VideoAnalysisVO getVideoAnalysis();
}
