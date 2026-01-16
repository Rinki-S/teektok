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
    public Result<String> upload(@ModelAttribute VideoUploadDTO dto) throws Exception { // 使用 @ModelAttribute 或直接对象接收
        Long userId = BaseContext.getCurrentId();
        videoService.upload(dto, userId);
        return Result.success();
    }

    // ==================== 视频列表 ====================

    @Operation(summary = "获取视频列表")
    @GetMapping("/list")
    public Result<PageResult<VideoVO>> list(VideoQueryDTO videoQueryDTO) {
        return Result.success(videoService.list(videoQueryDTO));
    }

    // ==================== 播放视频 ====================

/*    @Operation(summary = "播放视频（记录播放行为）")
    @PostMapping("/play")
    public Result<Void> play(@RequestBody PlayDTO dto) {
        videoService.play(dto);
        return Result.success();
    }*/
}
