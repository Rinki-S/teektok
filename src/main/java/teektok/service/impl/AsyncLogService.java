package teektok.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import teektok.entity.UserBehavior;
import teektok.mapper.UserBehaviorMapper;

import java.time.LocalDateTime;

@Slf4j
@Service
public class AsyncLogService {

    @Autowired
    private UserBehaviorMapper userBehaviorMapper;

    /**
     * 异步记录用户行为
     * 使用 "commonExecutor" 线程池 (对应 ThreadPoolConfig 中的 Bean 名)
     */
    @Async("commonExecutor")
    public void saveUserBehavior(Long userId, Long videoId, Integer type) {
        try {
            log.info("异步线程 [{}] 开始记录日志...", Thread.currentThread().getName());

            UserBehavior behavior = new UserBehavior();
            behavior.setUserId(userId);
            behavior.setVideoId(videoId);
            behavior.setBehaviorType(type);
            behavior.setCreateTime(LocalDateTime.now());

            userBehaviorMapper.insert(behavior);

            log.info("异步记录完成");
        } catch (Exception e) {
            log.error("写入行为日志失败: uid={}, vid={}", userId, videoId, e);
        }
    }
}