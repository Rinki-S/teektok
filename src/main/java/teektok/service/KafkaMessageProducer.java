package teektok.service;

import teektok.entity.UserBehavior;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import jakarta.annotation.Resource;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;

@Service
public class KafkaMessageProducer {

    @Resource
    private KafkaTemplate<String, UserBehavior> kafkaTemplate;

    @Resource
    private KafkaTemplate<String, byte[]> kafkaTemplate1;

    @Value("${kafka.topic.behavior}")
    private String behaviorTopic;

    /**
     * 发送对象到Kafka（使用CompletableFuture替代ListenableFuture）
     */
    public void sendBehaviorObject(UserBehavior behavior) {
        CompletableFuture<SendResult<String, UserBehavior>> future = kafkaTemplate.send(behaviorTopic, behavior);

        // 使用CompletableFuture的回调方法
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                // 发送成功
                System.out.println("对象消息发送成功：");
                System.out.println("Topic: " + result.getRecordMetadata().topic());
                System.out.println("Partition: " + result.getRecordMetadata().partition());
                System.out.println("发送的对象：" + behavior);
            } else {
                // 发送失败
                System.err.println("对象消息发送失败：" + ex.getMessage());
                ex.printStackTrace();
            }
        });
    }

    /**
     * 发送字符串到Kafka（同样用CompletableFuture）
     */
    public void sendMessageAsync(String message) {
        // 把字符串转成 UTF-8 编码的字节数组
        byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);
        //发送字符串
        CompletableFuture<SendResult<String, byte[]>> future = kafkaTemplate1.send(behaviorTopic, messageBytes);
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                System.out.println("字符串消息发送成功，Topic：" + result.getRecordMetadata().topic());
            } else {
                System.err.println("字符串消息发送失败：" + ex.getMessage());
            }
        });
    }
}
