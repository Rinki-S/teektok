package teektok.controller;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import teektok.entity.UserBehavior;
import teektok.service.KafkaMessageProducer;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Random;

@Slf4j
@RestController
public class TestController {

    @Resource
    private KafkaMessageProducer kafkaMessageProducer;

    @GetMapping("/sendmsg")
    public String sendBehavior() {
        try {
            Random random = new Random();
            ObjectMapper objectMapper = new ObjectMapper();
            // 解决 Jackson 处理 Java 8 时间类型的问题（如果报错 JavaTimeModule，需要添加 jackson-datatype-jsr310 依赖并注册模块）
            objectMapper.registerModule(new JavaTimeModule());

            for (int i = 1; i < 50; i++) { // 这里的循环次数改成50测试一下即可
                // 创建一个测试对象
                UserBehavior userBehavior = new UserBehavior();
                // id 自增，通常不需要设置，或者模拟设置
                userBehavior.setUserId((long) random.nextInt(100)); // 模拟 UserId
                userBehavior.setVideoId((long) random.nextInt(1000)); // 模拟 VideoId
                userBehavior.setBehaviorType(random.nextInt(5) + 1); // 模拟 1-5 的行为类型
                userBehavior.setCreateTime(LocalDateTime.now());

                // 1. 方式一：发送字符串消息
                String jsonStr = objectMapper.writeValueAsString(userBehavior);
                // 注意：Slf4j 的使用方式是 log.info("pattern {}", arg)
                log.info("Sending message {}: {}", i, jsonStr);
                kafkaMessageProducer.sendMessageAsync(jsonStr);

                // 2. 方式二：也可以直接发送对象（如果您配置了对应的序列化器）
                // kafkaMessageProducer.sendBehaviorObject(userBehavior);
            }
            return "{\"code\": 200, \"msg\": \"发送成功！\"}";
        } catch (Exception e) {
            log.error("发送失败", e);
            return "{\"code\": 500, \"msg\": \"发送失败！" + e.getMessage() + "\"}";
        }
    }
}
