package teektok.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import teektok.entity.UserBehavior;
import teektok.service.BehaviorEventPubliser;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class KafkaBehaviorEventPubliser implements BehaviorEventPubliser {

    @Autowired
    private KafkaMessageProducer kafkaMessageProducer;

    // Jackson 序列化工具
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 修正：与数据库 user_behavior.favorite_type 保持一致
    private static final Integer TYPE_PLAY = 1;
    private static final Integer TYPE_LIKE = 2;
    private static final Integer TYPE_COLLECT = 3;
    private static final Integer TYPE_COMMENT = 4;
    private static final Integer TYPE_SHARE = 5;

    private static int id = 1;

    /**
     * 发布播放事件
     * 发送对象：用于在 user_behavior 表中记录播放历史 (Type=1)
     */
    @Override
    public void publishPlayEvent(Long videoId, Long userId) {
        sendBehaviorMap(videoId, userId, TYPE_PLAY, null);
    }



    @Override
    public void publishLikeEvent(Long videoId, Long userId) {
        sendBehaviorMap(videoId, userId, TYPE_LIKE, null);
    }

    @Override
    public void publishFavoriteEvent(Long videoId, Long userId) {
        sendBehaviorMap(videoId, userId, TYPE_COLLECT, null);
    }

    @Override
    public void publishCommentEvent(Long videoId, Long userId, String content) {
        sendBehaviorMap(videoId, userId, TYPE_COMMENT, null);
    }

    @Override
    public void publishShareEvent(Long videoId, Long userId) {
        sendBehaviorMap(videoId, userId, TYPE_SHARE, null);
    }

    // =========================== 私有辅助方法 ===========================

    /**
     * 构建并发送符合 Spark 要求的 Map 结构
     * Kafka 的 JsonSerializer 会自动把它变成 JSON:
     * { "id": 1, "userId": 1001, "movieId": 2005, "createDate": }
     */
    private void sendBehaviorMap(Long videoId, Long userId, Integer type, String content) {
        Map<String, Object> message = new HashMap<>();
        message.put("id", id);
        message.put("uid", userId);
        message.put("mid", videoId); // 对应你要求的字段名
        message.put("behaviorType", type);
        message.put("createDate", System.currentTimeMillis());
        id++;

        // 组装 extra 嵌套对象
        /*Map<String, Object> extra = new HashMap<>();
        extra.put("duration", 45); // 示例：实际应从前端传参
        extra.put("playProgress", 0.8);
        if (content != null) {
            extra.put("content", content); // 评论内容放在 extra 里
        }
        message.put("extra", extra);*/

        // 直接发送 Map！
        kafkaMessageProducer.sendEvent(message);
    }

    /**
     * 发送简单的指令事件
     */
/*    private void sendSimpleEvent(String eventType, Long videoId, Long userId) {
        Map<String, Object> msgMap = new HashMap<>();
        msgMap.put("event", eventType);
        msgMap.put("movieId", videoId);
        msgMap.put("userId", userId);
        msgMap.put("timestamp", System.currentTimeMillis());

        // 直接发送 Map！
        kafkaMessageProducer.sendEvent(msgMap);
    }*/
}
