package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import teektok.dto.user.UserLoginDTO;
import teektok.dto.user.UserLoginVO;
import teektok.dto.user.UserMeVO;
import teektok.dto.user.UserRegisterDTO;
import teektok.dto.user.UserSearchVO;
import teektok.entity.Relation;
import teektok.entity.User;
import teektok.entity.VideoStat;
import teektok.entity.Video;
import teektok.mapper.RelationMapper;
import teektok.mapper.UserMapper;
import teektok.mapper.VideoStatMapper;
import teektok.mapper.VideoMapper;
import teektok.service.IUserService;
import teektok.utils.JwtUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UserServiceImpl implements IUserService {

    @Autowired
    private UserMapper userMapper;
    @Autowired
    private RelationMapper relationMapper;
    @Autowired
    private VideoMapper videoMapper;
    @Autowired
    private VideoStatMapper videoStatMapper;
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String USER_INFO_KEY = "user:info:";

    @Override
    public void register(UserRegisterDTO userRegisterDTO) {
        if (userRegisterDTO.getUsername() == null || userRegisterDTO.getUsername().isBlank()) {
            throw new RuntimeException("用户名不能为空");
        }
        if (userRegisterDTO.getPassword() == null || userRegisterDTO.getPassword().isBlank()) {
            throw new RuntimeException("密码不能为空");
        }
        //TODO：完成注册功能
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, userRegisterDTO.getUsername());
        Long count = userMapper.selectCount(queryWrapper);

        if(count > 0) {throw new RuntimeException("用户名已存在");}

        User user = new User();
        user.setUsername(userRegisterDTO.getUsername());
        user.setPassword(userRegisterDTO.getPassword());
        user.setStatus(1);

        int result = userMapper.insert(user);
        if(result<=0){
            throw new RuntimeException("注册失败，请稍后重试");
        }

    }

    @Override
    public UserLoginVO login(UserLoginDTO userLoginDTO) {
        if (userLoginDTO.getUsername() == null || userLoginDTO.getPassword() == null) {
            throw new RuntimeException("用户名或密码不能为空");
        }

        // TODO 1：根据用户名查询用户
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, userLoginDTO.getUsername());
        User user = userMapper.selectOne(queryWrapper);
        // TODO 2：校验密码是否正确
        if (user == null || !user.getPassword().equals(userLoginDTO.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        // TODO 3：生成 token
        Map<String, Object> claims =new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("username", user.getUsername());
        claims.put("password", user.getPassword());
        String token= JwtUtils.createToken(claims);
        // TODO 4：封装 VO 返回
        UserLoginVO userLoginVO = new UserLoginVO();
        userLoginVO.setUserId(user.getId());
        userLoginVO.setToken(token);
        return  userLoginVO;
    }

    @Override
    public UserMeVO getMyInfo(Long userId) {

        // 1. 查询基础信息
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        UserMeVO vo = new UserMeVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setAvatar(user.getAvatar());

        // 2. 查询关注数量 (userId 为关注者)
        Long followingCount = relationMapper.selectCount(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getUserId, userId));
        vo.setFollowingCount(followingCount);

        // 3. 查询粉丝数量 (userId 为被关注对象)
        Long followerCount = relationMapper.selectCount(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getTargetId, userId));
        vo.setFollowerCount(followerCount);

        // 4. 查询作品URL列表
        List<Video> videos = videoMapper.selectList(new LambdaQueryWrapper<Video>()
                .eq(Video::getUploaderId, userId)
                .orderByDesc(Video::getCreateTime));

        List<Long> videoIds = videos.stream().map(Video::getId).collect(Collectors.toList());
        long likeCount = 0L;
        if (!videoIds.isEmpty()) {
            List<VideoStat> stats = videoStatMapper.selectBatchIds(videoIds);
            likeCount = stats.stream()
                    .map(VideoStat::getLikeCount)
                    .filter(v -> v != null)
                    .mapToLong(Long::longValue)
                    .sum();
        }
        vo.setLikeCount(likeCount);

        List<String> videoUrls = videos.stream()
                .map(Video::getVideoUrl)
                .collect(Collectors.toList());
        vo.setVideoUrls(videoUrls);

        //5. 查询作品封面URL列表
        List<String> videoCoverUrls = videos.stream()
                .map(Video::getCoverUrl)
                .collect(Collectors.toList());
        vo.setVideoCoverUrls(videoCoverUrls);
        return vo;
    }
    @Override
    public User getUserCached(Long userId) {
        String key = USER_INFO_KEY + userId;

        // 1. 查 Redis
        User user = (User) redisTemplate.opsForValue().get(key);
        if (user != null) {
            return user;
        }

        // 2. 查 DB
        user = userMapper.selectById(userId);

        // 3. 写 Redis (设置 24 小时过期，防止冷数据长期占用)
        if (user != null) {
            long timeout = 24 * 60 * 60 + new Random().nextInt(3600); // 24小时 + 0~1小时随机
            redisTemplate.opsForValue().set(key, user, timeout, TimeUnit.HOURS);
        } else {
            // 防止缓存穿透：存入空值（过期时间短一点，如 5 分钟）
             redisTemplate.opsForValue().set(key, new User(), 5, TimeUnit.MINUTES);
        }

        return user;
    }

    @Override
    public List<UserSearchVO> searchUsers(Long currentUserId, String keyword, Integer page, Integer size) {
        String kw = keyword == null ? "" : keyword.trim();
        if (kw.isEmpty()) {
            return List.of();
        }

        int pageNum = page == null || page < 1 ? 1 : page;
        int pageSize = size == null || size < 1 ? 20 : Math.min(size, 50);

        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<User>()
                .select(User::getId, User::getUsername, User::getAvatar)
                .orderByDesc(User::getId);

        if (currentUserId != null) {
            wrapper.ne(User::getId, currentUserId);
        }

        boolean isNumeric = kw.chars().allMatch(Character::isDigit);
        if (isNumeric) {
            Long targetId = Long.valueOf(kw);
            wrapper.and(w -> w.eq(User::getId, targetId).or().like(User::getUsername, kw));
        } else {
            wrapper.like(User::getUsername, kw);
        }

        Page<User> mpPage = new Page<>(pageNum, pageSize);
        List<User> users = userMapper.selectPage(mpPage, wrapper).getRecords();

        if (users == null || users.isEmpty()) {
            return List.of();
        }

        Set<Long> userIds = users.stream().map(User::getId).collect(Collectors.toSet());
        Set<Long> followedIds = Set.of();
        if (currentUserId != null && !userIds.isEmpty()) {
            List<Relation> relations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                    .eq(Relation::getUserId, currentUserId)
                    .in(Relation::getTargetId, userIds));
            followedIds = relations.stream().map(Relation::getTargetId).collect(Collectors.toSet());
        }

        Set<Long> finalFollowedIds = followedIds;
        return users.stream().map(u -> {
            UserSearchVO vo = new UserSearchVO();
            vo.setId(u.getId());
            vo.setUsername(u.getUsername());
            vo.setAvatar(u.getAvatar());
            vo.setIsFollowing(finalFollowedIds.contains(u.getId()));
            return vo;
        }).collect(Collectors.toList());
    }

}
