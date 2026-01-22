package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import teektok.VO.PageResult;
import teektok.dto.commen.Result;
import teektok.dto.dm.DmSendDTO;
import teektok.entity.DmMessage;
import teektok.entity.User;
import teektok.entity.Video;
import teektok.mapper.UserMapper;
import teektok.mapper.VideoMapper;
import teektok.service.IDmService;
import teektok.utils.BaseContext;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Tag(name = "私信模块", description = "用户私信（文字/分享视频）")
@RestController
@RequestMapping("/api/dm")
public class DmController {

    @Autowired
    private IDmService dmService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private VideoMapper videoMapper;

    private Long getCurrentUserId() {
        return BaseContext.getCurrentId();
    }

    @Operation(summary = "发送私信（文字/视频）")
    @PostMapping("/send")
    public Result<Void> send(@RequestBody DmSendDTO dto) {
        Long senderId = getCurrentUserId();
        if (senderId == null) return Result.fail(401, "未登录");
        if (dto == null || dto.getTargetId() == null || dto.getMsgType() == null) {
            return Result.fail(400, "参数错误");
        }
        if (senderId.equals(dto.getTargetId())) {
            return Result.fail(400, "不能给自己发送私信");
        }

        User target = userMapper.selectById(dto.getTargetId());
        if (target == null) {
            return Result.fail(404, "用户不存在");
        }

        Integer msgType = dto.getMsgType();
        try {
            if (msgType == 1) {
                String content = dto.getContent();
                if (content == null || content.trim().isEmpty()) {
                    return Result.fail(400, "私信内容不能为空");
                }
                if (content.length() > 2000) {
                    return Result.fail(400, "私信内容过长");
                }
                dmService.sendText(senderId, dto.getTargetId(), content.trim());
                return Result.success();
            }

            if (msgType == 2) {
                if (dto.getVideoId() == null) {
                    return Result.fail(400, "videoId 不能为空");
                }
                Video video = videoMapper.selectById(dto.getVideoId());
                if (video == null) {
                    return Result.fail(404, "视频不存在");
                }
                dmService.sendVideo(senderId, dto.getTargetId(), dto.getVideoId());
                return Result.success();
            }

            return Result.fail(400, "不支持的消息类型");
        } catch (RuntimeException e) {
            String msg = (e.getMessage() == null || e.getMessage().trim().isEmpty()) ? "发送失败" : e.getMessage();
            if (msg.contains("最多只能发送一条")) {
                return Result.fail(403, msg);
            }
            return Result.fail(500, msg);
        }
    }

    @Operation(summary = "获取与某用户的私信会话（分页）")
    @GetMapping("/session/{targetId}")
    public Result<PageResult<DmMessage>> session(
            @PathVariable("targetId") Long targetId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Long userId = getCurrentUserId();
        if (userId == null) return Result.fail(401, "未登录");
        if (targetId == null) return Result.fail(400, "参数错误");

        PageResult<DmMessage> result = dmService.listSessionMessages(userId, targetId, page, size);
        List<DmMessage> records = result.getList();
        if (records == null || records.isEmpty()) {
            return Result.success(new PageResult<>(Collections.emptyList(), result.getTotal()));
        }

        List<DmMessage> ordered = new ArrayList<>(records);
        Collections.reverse(ordered);
        return Result.success(new PageResult<>(ordered, result.getTotal()));
    }
}

