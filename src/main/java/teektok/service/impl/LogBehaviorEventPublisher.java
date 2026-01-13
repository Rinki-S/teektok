package teektok.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import teektok.service.BehaviorEventPublisher;

@Slf4j
@Service
public class LogBehaviorEventPublisher implements BehaviorEventPublisher {
    @Override
    public void publishPlayEvent(Long videoId, Long userId) {
        System.out.println("[EVENT] play video=" + videoId + ", user=" + userId);
    }

    @Override
    public void publishLikeEvent(Long videoId, Long userId) {
        System.out.println("[EVENT] like video=" + videoId + ", user=" + userId);
    }

    @Override
    public void publishUnlikeEvent(Long videoId, Long userId) {
        System.out.println("[EVENT] unlike video=" + videoId + ", user=" + userId);
    }

    @Override
    public void publishCommentEvent(Long videoId, Long userId, String content) {
        System.out.println("[EVENT] comment video=" + videoId +
                ", user=" + userId + ", content=" + content);
    }

    @Override
    public void publishShareEvent(Long videoId, Long userId) {
        System.out.println("[EVENT] share video=" + videoId + ", user=" + userId);
    }
}
