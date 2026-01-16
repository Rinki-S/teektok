package teektok.service;

import teektok.dto.comment.CommentCreateDTO;

public interface IBehaviorService {
    /*
     * 播放视频
     * */
    void play(Long videoId, Long userId);

    /*
     * 点赞视频
     * */
    void like(Long videoId, Long userId);

    /*
     * 取消点赞
     * */
    void unlike(Long videoId, Long userId);

    /*
     * 收藏视频 (新增)
     * */
    void favorite(Long videoId, Long userId);

    /*
     * 取消收藏 (新增)
     * */
    void unfavorite(Long videoId, Long userId);

    /*
     * 评论视频
     * */
    void comment(CommentCreateDTO commentCreateDTO, Long userId);

    /*
     * 转发视频
     * */
    void share(Long videoId, Long userId);
}
