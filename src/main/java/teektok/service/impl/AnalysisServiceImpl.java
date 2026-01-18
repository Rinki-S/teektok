package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import teektok.dto.analysis.VideoAnalysisVO;
import teektok.entity.UserBehavior;
import teektok.mapper.CommentMapper;
import teektok.mapper.UserBehaviorMapper;
import teektok.mapper.VideoLikeMapper;
import teektok.service.IAnalysisService;

@Slf4j
@Service
public class AnalysisServiceImpl implements IAnalysisService {

    // TODO: 注入你实际生成的 Mapper
    @Autowired
    private UserBehaviorMapper userBehaviorMapper;

    @Autowired
    private VideoLikeMapper videoLikeMapper;

    @Autowired
    private CommentMapper commentMapper;

    @Override
    public VideoAnalysisVO getVideoAnalysis() {
        VideoAnalysisVO vo = new VideoAnalysisVO();

        // 1. 获取全站播放量
        Long playCount = userBehaviorMapper.selectCount(new LambdaQueryWrapper<UserBehavior>().eq(UserBehavior::getBehaviorType, 1));

        // 2. 获取全站点赞量
        Long likeCount = videoLikeMapper.selectCount(null);

        // 3. 获取全站评论量
        Long commentCount = commentMapper.selectCount(null);

        // 4. 封装 VO
        vo.setPlayCount(playCount);
        vo.setLikeCount(likeCount);
        vo.setCommentCount(commentCount);

        return vo;
    }
}
