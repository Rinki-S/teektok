package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import teektok.dto.analysis.VideoAnalysisVO;
import teektok.dto.commen.Result;
import teektok.service.IAnalysisService;

@Tag(name = "数据分析模块", description = "提供全站或个人的数据统计服务")
@RestController
@RequestMapping("/analysis")
public class AnalysisController {

    @Autowired
    private IAnalysisService analysisService;

    /**
     * 获取视频行为统计数据
     * 接口: GET /analysis/video
     * 返回: VideoAnalysisVO (包含 playCount, likeCount, commentCount)
     */
    @Operation(summary = "获取全站视频行为统计")
    @GetMapping("/video")
    public Result<VideoAnalysisVO> getVideoAnalysis() {
        VideoAnalysisVO vo = analysisService.getVideoAnalysis();
        return Result.success(vo);
    }
}
