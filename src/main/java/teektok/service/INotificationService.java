package teektok.service;

import teektok.VO.PageResult;
import teektok.entity.Notification;

public interface INotificationService {
    void createNotification(Long userId, Long actorId, Integer type, Integer targetType, Long targetId, String content);

    PageResult<Notification> listNotifications(Long userId, int page, int size);

    long countUnread(Long userId);

    void markAllRead(Long userId);

    void markRead(Long userId, Long notificationId);
}
