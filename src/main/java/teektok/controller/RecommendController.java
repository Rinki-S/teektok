package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import teektok.dto.commen.Result;
import teektok.dto.recommend.RecommendVideoVO;
import teektok.service.IRecommendService;
import teektok.utils.BaseContext;

import java.util.List;

@RestController
@RequestMapping("/api/recommend")
@Tag(name = "推荐模块", description = "提供视频流服务")
public class RecommendController {

    @Autowired
    private IRecommendService recommendService;

    @Operation(summary = "获取个性化推荐视频流")
    @GetMapping("/{userId}")
    public Result<List<RecommendVideoVO>> getFeed(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long refresh) {
        // 如果前端没传 userId，说明是游客，Service 会自动走兜底逻辑
        List<RecommendVideoVO> list = recommendService.getPersonalRecommendFeed(userId, page, size, refresh);
        return Result.success(list);
    }

    @Operation(summary = "获取热门推荐视频流")
    @GetMapping("/hot")
    public Result<List<RecommendVideoVO>> getHot(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long refresh) {
        Long currentUserId = BaseContext.getCurrentId();
        if (currentUserId == null) currentUserId = userId;
        List<RecommendVideoVO> list = recommendService.getHotRecommendFeed(currentUserId, page, size, refresh);
        return Result.success(list);
    }
}
