package teektok.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import teektok.dto.comment.CommentCreateDTO;
import teektok.service.BehaviorEventPublisher;
import teektok.service.IBehaviorService;

@Slf4j
@Service
public class BehaviorServiceImpl implements IBehaviorService {

    private final BehaviorEventPublisher eventPublisher;

    public BehaviorServiceImpl(@Qualifier("logBehaviorEventPublisher") BehaviorEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Override
    public void play(Long videoId, Long userId) {
        //TODO:实现业务逻辑

        //TODO:发布行为事件
        eventPublisher.publishPlayEvent(videoId, userId);
    }

    @Override
    public void like(Long videoId, Long userId) {
        // TODO 点赞业务
        // saveLikeRecord(videoId, userId);

        // TODO 发布事件
        eventPublisher.publishLikeEvent(videoId, userId);
    }

    @Override
    public void unlike(Long videoId, Long userId) {
        // TODO 取消点赞
        // deleteLikeRecord(videoId, userId);

        // TODO 发布事件
        eventPublisher.publishUnlikeEvent(videoId, userId);
    }

    @Override
    public void comment(CommentCreateDTO commentCreateDTO, Long userId) {
        //保存评论
//        saveComment(commentCreateDTO);

        //TODO 发布评论
        eventPublisher.publishCommentEvent(
                commentCreateDTO.getVideoId(),
                userId,
                commentCreateDTO.getContent()
        );

    }

    @Override
    public void share(Long videoId, Long userId) {
        // TODO 分享业务
        // recordShare(videoId, userId);

        // TODO 发布事件
        eventPublisher.publishShareEvent(videoId, userId);
    }
}
