package teektok.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;
import teektok.VO.PageResult;
import teektok.entity.Notification;
import teektok.mapper.NotificationMapper;
import teektok.service.INotificationService;

import java.time.LocalDateTime;

@Service
public class NotificationServiceImpl extends ServiceImpl<NotificationMapper, Notification> implements INotificationService {

    @Override
    public void createNotification(
            Long userId,
            Long actorId,
            Integer type,
            Integer targetType,
            Long targetId,
            String content
    ) {
        if (userId == null || actorId == null) return;
        if (userId.equals(actorId)) return;

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setActorId(actorId);
        notification.setType(type);
        notification.setTargetType(targetType);
        notification.setTargetId(targetId);
        notification.setContent(content);
        notification.setIsRead(0);
        notification.setCreateTime(LocalDateTime.now());
        save(notification);
    }

    @Override
    public PageResult<Notification> listNotifications(Long userId, int page, int size) {
        Page<Notification> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Notification> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Notification::getUserId, userId)
                .orderByDesc(Notification::getCreateTime);
        Page<Notification> result = page(pageParam, queryWrapper);
        return new PageResult<>(result.getRecords(), result.getTotal());
    }

    @Override
    public long countUnread(Long userId) {
        return count(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0));
    }

    @Override
    public void markAllRead(Long userId) {
        update(new LambdaUpdateWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0)
                .set(Notification::getIsRead, 1));
    }

    @Override
    public void markRead(Long userId, Long notificationId) {
        if (notificationId == null) return;
        update(new LambdaUpdateWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getId, notificationId)
                .set(Notification::getIsRead, 1));
    }
}
