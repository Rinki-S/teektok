package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import teektok.VO.NotificationVO;
import teektok.VO.PageResult;
import teektok.dto.commen.Result;
import teektok.entity.Notification;
import teektok.entity.User;
import teektok.mapper.UserMapper;
import teektok.service.INotificationService;
import teektok.utils.BaseContext;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Tag(name = "消息通知模块", description = "关注、点赞、评论通知")
@RestController
@RequestMapping("/api/notification")
public class NotificationController {

    @Autowired
    private INotificationService notificationService;

    @Autowired
    private UserMapper userMapper;

    private Long getCurrentUserId() {
        return BaseContext.getCurrentId();
    }

    @Operation(summary = "通知列表（分页）")
    @GetMapping("/list")
    public Result<PageResult<NotificationVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageResult<Notification> pageResult = notificationService.listNotifications(getCurrentUserId(), page, size);
        List<Notification> records = pageResult.getList();

        Set<Long> actorIds = records.stream()
                .map(Notification::getActorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, User> userMap = Collections.emptyMap();
        if (!actorIds.isEmpty()) {
            List<User> users = userMapper.selectBatchIds(actorIds);
            userMap = users.stream().collect(Collectors.toMap(User::getId, Function.identity()));
        }

        List<NotificationVO> voList = new ArrayList<>(records.size());
        for (Notification notification : records) {
            NotificationVO vo = new NotificationVO();
            BeanUtils.copyProperties(notification, vo);
            User actor = userMap.get(notification.getActorId());
            if (actor != null) {
                vo.setActorUsername(actor.getUsername());
                vo.setActorAvatar(actor.getAvatar());
            }
            voList.add(vo);
        }

        return Result.success(new PageResult<>(voList, pageResult.getTotal()));
    }

    @Operation(summary = "未读数量")
    @GetMapping("/unread/count")
    public Result<Long> unreadCount() {
        return Result.success(notificationService.countUnread(getCurrentUserId()));
    }

    @Operation(summary = "全部标记已读")
    @PostMapping("/read/all")
    public Result<Void> markAllRead() {
        notificationService.markAllRead(getCurrentUserId());
        return Result.success();
    }

    @Operation(summary = "单条标记已读")
    @PostMapping("/read/{id}")
    public Result<Void> markRead(@PathVariable("id") Long id) {
        notificationService.markRead(getCurrentUserId(), id);
        return Result.success();
    }
}
