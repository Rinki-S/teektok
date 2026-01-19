package teektok.service;

import teektok.VO.PageResult;
import teektok.entity.User;

import java.util.List;

public interface IRelationService {

    /**
     * 关注用户
     */
    void follow(Long userId, Long targetId);

    /**
     * 取消关注
     */
    void unfollow(Long userId, Long targetId);

    /**
     * 获取关注列表
     */
    List<User> getFollowList(Long userId);

    /**
     * 获取粉丝列表
     */
    List<User> getFollowerList(Long userId);

    /**
     * 获取朋友列表（互相关注）
     */
    List<User> getFriendList(Long userId);
    
    /**
     * 检查是否关注
     */
    boolean isFollowing(Long userId, Long targetId);
}
