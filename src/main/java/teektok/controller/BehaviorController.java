package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.kafka.common.serialization.VoidDeserializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import teektok.dto.behavior.BehaviorDTO;
import teektok.dto.behavior.PlayDTO;
import teektok.dto.behavior.ShareDTO;
import teektok.dto.commen.Result;
import teektok.dto.comment.CommentCreateDTO;
import teektok.service.IBehaviorService;
import teektok.utils.BaseContext;

@Tag(name = "用户行为模块", description = "处理点赞、评论、转发等互动行为")
@RestController
@RequestMapping("/api/behavior")
public class BehaviorController {

    @Autowired
    private IBehaviorService behaviorService;

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        return BaseContext.getCurrentId();
    }

    @Operation(summary = "播放视频")
    @PostMapping("/play")
    public Result<Void> play(@RequestBody PlayDTO dto) {
        behaviorService.play(dto.getVideoId(), getCurrentUserId());
        return Result.success();
    }

    @Operation(summary = "点赞视频")
    @PostMapping("/like")
    public Result<Void> like(@RequestBody BehaviorDTO dto) {
        behaviorService.like(dto.getVideoId(), getCurrentUserId());
        return Result.success();
    }

    @Operation(summary = "取消点赞视频")
    @PostMapping("/unlike")
    public Result<Void> unlike(@RequestBody BehaviorDTO dto) {
        behaviorService.unlike(dto.getVideoId(), getCurrentUserId());
        return Result.success();
    }

    @Operation(summary = "评论视频")
    @PostMapping("/comment")
    public Result<Void> comment(@RequestBody CommentCreateDTO dto) {
        behaviorService.comment(dto, getCurrentUserId());
        return Result.success();
    }

    @Operation(summary = "转发视频")
    @PostMapping("/share")
    public Result<Void> share(@RequestBody ShareDTO dto) {
        behaviorService.share(dto.getVideoId(), getCurrentUserId());
        return Result.success();
    }

    @Operation(summary = "收藏视频")
    @PostMapping("/favorite")
    public Result<Void> favorite(@RequestBody BehaviorDTO dto) {
        behaviorService.favorite(dto.getVideoId(), getCurrentUserId());
        return Result.success();
    }

    @Operation(summary = "取消收藏视频")
    @PostMapping("/unfavorite")
    public Result<Void> unfavorite(@RequestBody BehaviorDTO dto) {
        behaviorService.unfavorite(dto.getVideoId(), getCurrentUserId());
        return Result.success();
    }
}