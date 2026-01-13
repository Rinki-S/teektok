package teektok.service;

/*
* 实现消息队列
* */

public interface BehaviorEventPublisher {
    void publishPlayEvent(Long videoId, Long userId);

    void publishLikeEvent(Long videoId, Long userId);

    void publishUnlikeEvent(Long videoId, Long userId);

    void publishCommentEvent(Long videoId, Long userId, String content);

    void publishShareEvent(Long videoId, Long userId);
}
