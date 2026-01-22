package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import teektok.VO.PageResult;
import teektok.dto.behavior.PlayDTO;
import teektok.dto.commen.Result;
import teektok.dto.video.VideoQueryDTO;
import teektok.dto.video.VideoUploadDTO;
import teektok.dto.video.VideoVO;
import teektok.service.IVideoService;
import teektok.utils.AliyunOSSOperator;
import teektok.utils.BaseContext;


@RestController
@RequestMapping("/api/video")
@Tag(name = "视频模块")
public class VideoController {
    private final IVideoService videoService;

    @Autowired
    private AliyunOSSOperator ossOperator;

    public VideoController(IVideoService videoService) {
        this.videoService = videoService;
    }

    // ==================== 上传视频 ====================
    @Operation(summary = "上传视频")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<String> upload(@ModelAttribute VideoUploadDTO dto) { // 使用 @ModelAttribute 或直接对象接收
        try {
            Long userId = BaseContext.getCurrentId();
            if (userId == null) {
                return Result.fail(401, "未登录");
            }
            String url = videoService.upload(dto, userId);
            return Result.success(url);
        } catch (RuntimeException e) {
            return Result.fail(500, e.getMessage());
        } catch (Exception e) {
            return Result.fail(500, "上传视频失败");
        }
    }

    // ==================== 视频列表 ====================

    @Operation(summary = "获取视频列表")
    @GetMapping("/list")
    public Result<PageResult<VideoVO>> list(VideoQueryDTO videoQueryDTO) {
        return Result.success(videoService.list(videoQueryDTO));
    }

    @Operation(summary = "获取视频详情")
    @GetMapping("/{id}")
    public Result<VideoVO> getDetail(@PathVariable Long id) {
        return Result.success(videoService.getDetail(id));
    }

    @Operation(summary = "获取当前用户点赞的视频列表")
    @GetMapping("/liked")
    public Result<PageResult<VideoVO>> getLikedVideos(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            // 可以抛出未登录异常，或者返回空列表
             throw new RuntimeException("请先登录");
        }
        return Result.success(videoService.getLikedVideos(userId, page, size));
    }

    @Operation(summary = "获取当前用户收藏的视频列表")
    @GetMapping("/favorited")
    public Result<PageResult<VideoVO>> getFavoritedVideos(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
             throw new RuntimeException("请先登录");
        }
        return Result.success(videoService.getFavoritedVideos(userId, page, size));
    }

    @Operation(summary = "获取当前用户上传的视频列表")
    @GetMapping("/my")
    public Result<PageResult<VideoVO>> getMyVideos(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new RuntimeException("请先登录");
        }
        return Result.success(videoService.getMyVideos(userId, page, size));
    }

    @Operation(summary = "获取当前用户观看历史")
    @GetMapping("/history")
    public Result<PageResult<VideoVO>> getHistoryVideos(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new RuntimeException("请先登录");
        }
        return Result.success(videoService.getHistoryVideos(userId, page, size));
    }

    @Operation(summary = "清空当前用户观看历史")
    @DeleteMapping("/history")
    public Result<Void> clearHistory() {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new RuntimeException("请先登录");
        }
        videoService.clearHistory(userId);
        return Result.success();
    }

    @Operation(summary = "删除当前用户某个视频的观看历史")
    @DeleteMapping("/history/{videoId}")
    public Result<Void> deleteHistoryVideo(@PathVariable Long videoId) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new RuntimeException("请先登录");
        }
        videoService.deleteHistoryVideo(userId, videoId);
        return Result.success();
    }

    // ==================== 播放视频 ====================

/*    @Operation(summary = "播放视频（记录播放行为）")
    @PostMapping("/play")
    public Result<Void> play(@RequestBody PlayDTO dto) {
        videoService.play(dto);
        return Result.success();
    }*/
}
