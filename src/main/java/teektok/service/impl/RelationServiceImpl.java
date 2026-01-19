package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import teektok.entity.Relation;
import teektok.entity.User;
import teektok.mapper.RelationMapper;
import teektok.mapper.UserMapper;
import teektok.service.IRelationService;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RelationServiceImpl extends ServiceImpl<RelationMapper, Relation> implements IRelationService {

    @Autowired
    private RelationMapper relationMapper;

    @Autowired
    private UserMapper userMapper;

    @Override
    public void follow(Long userId, Long targetId) {
        if (userId.equals(targetId)) {
            throw new RuntimeException("不能关注自己");
        }

        // 检查是否已关注
        boolean exists = relationMapper.exists(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getUserId, userId)
                .eq(Relation::getTargetId, targetId));
        
        if (!exists) {
            Relation relation = new Relation();
            relation.setUserId(userId);
            relation.setTargetId(targetId);
            relation.setCreateTime(LocalDateTime.now());
            relationMapper.insert(relation);
        }
    }

    @Override
    public void unfollow(Long userId, Long targetId) {
        relationMapper.delete(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getUserId, userId)
                .eq(Relation::getTargetId, targetId));
    }

    @Override
    public List<User> getFollowList(Long userId) {
        List<Relation> relations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getUserId, userId));
        
        if (relations.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> targetIds = relations.stream()
                .map(Relation::getTargetId)
                .collect(Collectors.toSet());

        return userMapper.selectBatchIds(targetIds);
    }

    @Override
    public List<User> getFollowerList(Long userId) {
        List<Relation> relations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getTargetId, userId));
        
        if (relations.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> followerIds = relations.stream()
                .map(Relation::getUserId)
                .collect(Collectors.toSet());

        return userMapper.selectBatchIds(followerIds);
    }

    @Override
    public List<User> getFriendList(Long userId) {
        // 1. 获取我关注的人
        List<Relation> myFollows = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getUserId, userId));
        Set<Long> myFollowIds = myFollows.stream()
                .map(Relation::getTargetId)
                .collect(Collectors.toSet());
        
        if (myFollowIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. 获取关注我的人 (且在我关注列表里)
        List<Relation> mutualRelations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getTargetId, userId)
                .in(Relation::getUserId, myFollowIds));
        
        Set<Long> friendIds = mutualRelations.stream()
                .map(Relation::getUserId)
                .collect(Collectors.toSet());

        if (friendIds.isEmpty()) {
            return Collections.emptyList();
        }

        return userMapper.selectBatchIds(friendIds);
    }

    @Override
    public boolean isFollowing(Long userId, Long targetId) {
        if (userId == null || targetId == null) return false;
        return relationMapper.exists(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getUserId, userId)
                .eq(Relation::getTargetId, targetId));
    }
}
