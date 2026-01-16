package teektok.service;

import teektok.entity.UserBehavior;

public interface BehaviorEventPubliser {
    /**
     * 发布播放事件
     */
    void publishPlayEvent(Long videoId, Long userId);

    /**
     * 发布点赞事件 (需要携带完整数据入库)
     */
    void publishLikeEvent(Long videoId, Long userId);

    /**
     * 发布取消点赞事件
     */
//    void publishUnlikeEvent(Long videoId, Long userId);

    /**
     * 发布收藏事件 (需要携带完整数据入库)
     */
    void publishFavoriteEvent(Long videoId, Long userId);

    /**
     * 发布取消收藏事件
     */
//    void publishUnfavoriteEvent(Long videoId, Long userId);

    /**
     * 发布评论事件
     */
    void publishCommentEvent(Long videoId, Long userId, String content);

    /**
     * 发布分享事件
     */
    void publishShareEvent(Long videoId, Long userId);
}
