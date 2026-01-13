package teektok.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import teektok.service.BehaviorEventPublisher;

@Slf4j
@Service
public class KafkaBehaviorEventPublisher implements BehaviorEventPublisher {
    @Override
    public void publishPlayEvent(Long videoId, Long userId) {

    }

    @Override
    public void publishLikeEvent(Long videoId, Long userId) {

    }

    @Override
    public void publishUnlikeEvent(Long videoId, Long userId) {

    }

    @Override
    public void publishCommentEvent(Long videoId, Long userId, String content) {

    }

    @Override
    public void publishShareEvent(Long videoId, Long userId) {

    }
}
