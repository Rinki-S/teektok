package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.kafka.common.serialization.VoidDeserializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import teektok.dto.behavior.BehaviorDTO;
import teektok.dto.behavior.ShareDTO;
import teektok.dto.commen.Result;
import teektok.dto.comment.CommentCreateDTO;
import teektok.service.IBehaviorService;

@Tag(name = "用户行为模块", description = "处理点赞、评论、转发等互动行为")
@RestController
@RequestMapping("/api/behavior")
public class BehaviorController {

    @Autowired
    private IBehaviorService behaviorService;

    /**
     * 获取当前登录用户ID
     * TODO: 后续应通过拦截器从 ThreadLocal 或 Token 中获取
     */
    private Long getCurrentUserId() {
        return 1L;
    }

    @Operation(summary = "播放视频")
    @PostMapping("/play")
    public Result<Void> play(
            @RequestParam("videoId") Long videoId,
            @RequestParam("userId") Long userId) {
        behaviorService.play(videoId, userId);
        return Result.success();
    }

    @Operation(summary = "点赞视频")
    @PostMapping("/like")
    public Result<Void> like(
            @RequestParam("videoId") Long videoId,
            @RequestParam("userId") Long userId) {
        behaviorService.like(videoId, userId);
        return Result.success();
    }

    @Operation(summary = "取消点赞视频")
    @PostMapping("/unlike")
    public Result<Void> unlike(
            @RequestParam("videoId") Long videoId,
            @RequestParam("userId") Long userId) {
        behaviorService.unlike(videoId, userId);
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
    public Result<Void> share(
            @RequestParam("videoId") Long videoId,
            @RequestParam("userId") Long userId) {
        behaviorService.share(videoId, userId);
        return Result.success();
    }

    @Operation(summary = "收藏视频")
    @PostMapping("/favorite")
    public Result<Void> favorite(
            @RequestParam("videoId") Long videoId,
            @RequestParam("userId") Long userId) {
        behaviorService.favorite(videoId, userId);
        return Result.success();
    }

    @Operation(summary = "取消收藏视频")
    @PostMapping("/unfavorite")
    public Result<Void> unfavorite(
            @RequestParam("videoId") Long videoId,
            @RequestParam("userId") Long userId) {
        behaviorService.unfavorite(videoId, userId);
        return Result.success();
    }
}