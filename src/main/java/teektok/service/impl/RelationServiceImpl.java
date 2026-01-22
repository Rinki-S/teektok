package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import teektok.entity.Relation;
import teektok.entity.User;
import teektok.mapper.RelationMapper;
import teektok.mapper.UserMapper;
import teektok.service.INotificationService;
import teektok.service.IRelationService;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class RelationServiceImpl extends ServiceImpl<RelationMapper, Relation> implements IRelationService {

    @Autowired
    private RelationMapper relationMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private INotificationService notificationService;

    // Redis Key 前缀: user:follow:{userId} -> Set<targetId>
    private static final String USER_FOLLOW_KEY = "user:follow:";

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

            // 2. Redis 缓存更新 (Cache Aside Pattern)
            // 策略：只有当缓存 Key 存在时才 add。如果不存在，说明是冷数据，交给读操作去懒加载（防止出现只存了 1 个的假象）。
            String key = USER_FOLLOW_KEY + userId;
            if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
                redisTemplate.opsForSet().add(key, targetId.toString());
                // 顺便续期
                long timeout = 24 * 60 * 60 + new Random().nextInt(3600); // 24小时 + 0~1小时随机
                redisTemplate.expire(key, timeout, TimeUnit.HOURS);
            }

            notificationService.createNotification(targetId, userId, 1, 1, userId, null);
        }
    }

    @Override
    public void unfollow(Long userId, Long targetId) {
        // 1. 数据库操作
        relationMapper.delete(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getUserId, userId)
                .eq(Relation::getTargetId, targetId));

        // 2. Redis 缓存更新
        String key = USER_FOLLOW_KEY + userId;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            redisTemplate.opsForSet().remove(key, targetId.toString());
        }
    }

    @Override
    public List<User> getFollowList(Long userId) {
        // 优化：尝试从 Redis 获取关注 ID 列表
        String key = USER_FOLLOW_KEY + userId;
        Set<String> targetIdsStr = redisTemplate.opsForSet().members(key);

        Set<Long> targetIds;
        if (targetIdsStr != null && !targetIdsStr.isEmpty()) {
            // A. 缓存命中
            targetIds = targetIdsStr.stream().map(Long::valueOf).collect(Collectors.toSet());
        } else {
            // B. 缓存未命中，查 DB 并回写 Redis
            List<Relation> relations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                    .eq(Relation::getUserId, userId));

            if (relations.isEmpty()) {
                return Collections.emptyList();
            }

           targetIds = relations.stream()
                    .map(Relation::getTargetId)
                    .collect(Collectors.toSet());

            // 回写 Redis
            String[] strings = targetIds.stream().map(String::valueOf).toArray(String[]::new);
            redisTemplate.opsForSet().add(key, strings);
            long timeout = 24 * 60 * 60 + new Random().nextInt(3600); // 24小时 + 0~1小时随机
            redisTemplate.expire(key, timeout, TimeUnit.HOURS);
        }
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

        // 优先查 Redis
        String key = USER_FOLLOW_KEY + userId;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(key, targetId.toString()));
        }

        // 兜底查 DB
        return relationMapper.exists(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getUserId, userId)
                .eq(Relation::getTargetId, targetId));
    }

    @Override
    public void loadUserFollowCache(Long userId) {
        String key = USER_FOLLOW_KEY + userId;

        // 1. Double Check (再次检查)
        // 因为是异步执行，可能前一个线程已经加载好了，这里再查一下 Redis，避免重复打扰数据库
        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            return;
        }

        // 2. 查数据库 (全量)
        List<Relation> relations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getUserId, userId));

        // 3. 写入 Redis
        if (relations.isEmpty()) {
            // A. 如果该用户没有关注任何人
            // 为了防止缓存穿透，可以存一个特殊的空标记，或者设置一个较短的过期时间
            // 存一个空 Set 的占位符 ("-1") 并设置短过期时间(5s)
            redisTemplate.opsForSet().add(key, "-1");
            redisTemplate.expire(key, 5, TimeUnit.MINUTES);
        } else {
            // B. 正常写入
            String[] targetIds = relations.stream()
                    .map(r -> r.getTargetId().toString())
                    .toArray(String[]::new);

            redisTemplate.opsForSet().add(key, targetIds);
            redisTemplate.expire(key, 24, TimeUnit.HOURS);
        }
    }
}
