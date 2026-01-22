package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import teektok.VO.PageResult;
import teektok.entity.DmMessage;
import teektok.mapper.DmMessageMapper;
import teektok.service.IDmService;
import teektok.service.INotificationService;
import teektok.service.IRelationService;

import java.time.LocalDateTime;

@Service
public class DmServiceImpl extends ServiceImpl<DmMessageMapper, DmMessage> implements IDmService {

    @Autowired
    private IRelationService relationService;

    @Autowired
    private INotificationService notificationService;

    @Override
    public void sendText(Long senderId, Long targetId, String content) {
        sendInternal(senderId, targetId, 1, content, null);
    }

    @Override
    public void sendVideo(Long senderId, Long targetId, Long videoId) {
        sendInternal(senderId, targetId, 2, null, videoId);
    }

    private void sendInternal(Long senderId, Long targetId, Integer msgType, String content, Long videoId) {
        if (senderId == null || targetId == null) {
            throw new RuntimeException("参数错误");
        }
        if (senderId.equals(targetId)) {
            throw new RuntimeException("不能给自己发送私信");
        }

        boolean targetFollowsMe = relationService.isFollowing(targetId, senderId);
        if (!targetFollowsMe) {
            long sentCount = count(new LambdaQueryWrapper<DmMessage>()
                    .eq(DmMessage::getSenderId, senderId)
                    .eq(DmMessage::getReceiverId, targetId));
            if (sentCount >= 1) {
                throw new RuntimeException("对方未关注你，最多只能发送一条私信");
            }
        }

        DmMessage message = new DmMessage();
        message.setSenderId(senderId);
        message.setReceiverId(targetId);
        message.setMsgType(msgType);
        message.setContent(content);
        message.setVideoId(videoId);
        message.setIsRead(0);
        message.setCreateTime(LocalDateTime.now());
        save(message);

        String preview = null;
        if (msgType != null && msgType == 1) {
            preview = truncateContent(content);
        }
        if (msgType != null && msgType == 2) {
            preview = "分享了一个视频";
        }
        notificationService.createNotification(targetId, senderId, 4, 1, senderId, preview);
    }

    private String truncateContent(String content) {
        if (content == null) return null;
        String trimmed = content.trim();
        if (trimmed.isEmpty()) return null;
        return trimmed.length() <= 120 ? trimmed : trimmed.substring(0, 120);
    }

    @Override
    public PageResult<DmMessage> listSessionMessages(Long userId, Long targetId, int page, int size) {
        if (userId == null || targetId == null) {
            return new PageResult<>(java.util.Collections.emptyList(), 0);
        }

        Page<DmMessage> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<DmMessage> wrapper = new LambdaQueryWrapper<DmMessage>()
                .and(w -> w.eq(DmMessage::getSenderId, userId).eq(DmMessage::getReceiverId, targetId)
                        .or()
                        .eq(DmMessage::getSenderId, targetId).eq(DmMessage::getReceiverId, userId))
                .orderByDesc(DmMessage::getCreateTime);

        Page<DmMessage> result = page(pageParam, wrapper);
        return new PageResult<>(result.getRecords(), result.getTotal());
    }
}
