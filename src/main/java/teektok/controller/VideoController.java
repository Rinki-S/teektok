package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import teektok.VO.PageResult;
import teektok.dto.commen.Result;
import teektok.dto.video.VideoQueryDTO;
import teektok.dto.video.VideoUploadDTO;
import teektok.dto.video.VideoVO;
import teektok.service.IVideoService;


@RestController
@RequestMapping("/api/video")
@Tag(name = "视频模块")
public class VideoController {
    private final IVideoService videoService;

    public VideoController(IVideoService videoService) {
        this.videoService = videoService;
    }

    // ==================== 上传视频 ====================
    @Operation(summary = "上传视频")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<Void> upload(@ModelAttribute VideoUploadDTO dto) { // 使用 @ModelAttribute 或直接对象接收
        videoService.upload(dto);
        return Result.success();
    }

    // ==================== 视频列表 ====================

    @Operation(summary = "获取视频列表")
    @GetMapping("/list")
    public Result<PageResult<VideoVO>> list(VideoQueryDTO videoQueryDTO) {
        return Result.success(videoService.list(videoQueryDTO));
    }

    // ==================== 播放视频 ====================

    @Operation(summary = "播放视频（记录播放行为）")
    @PostMapping("/play")
    public Result<Void> play(
            @RequestParam("videoId") Long videoId
    ) {
        // userId 实际应从登录态获取，这里先占位
        Long userId = 1L;

        videoService.play(videoId, userId);
        return Result.success();
    }
}
