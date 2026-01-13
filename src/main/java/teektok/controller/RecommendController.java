package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import teektok.dto.commen.Result;
import teektok.dto.recommend.PersonalRecommendDto;
import teektok.dto.recommend.RecommendVideoVO;
import teektok.service.IRecommendService;

import java.util.List;

@Tag(name = "推荐与排行榜模块")
@RestController
@RequestMapping("/api/recommend")
public class RecommendController {

    @Autowired
    private IRecommendService recommendService;

    /**
     * 获取热门视频列表
     * 接口: GET /recommend/hot
     */
    @Operation(summary = "获取热门视频")
    @GetMapping("/hot")
    public Result<List<RecommendVideoVO>> hotList() {
        List<RecommendVideoVO> list = recommendService.getHotVideos();
        return Result.success(list);
    }

    /**
     * 获取个性化推荐
     * 接口: GET /recommend/personal
     * 参数: userId (in DTO or Query param)
     */
    @Operation(summary = "获取个性化推荐")
    @GetMapping("/personal")
    public Result<List<RecommendVideoVO>> personalRecommend(PersonalRecommendDto dto) {
        // GET 请求，参数会自动绑定到 DTO 对象
        List<RecommendVideoVO> list = recommendService.getPersonalVideos(dto.getUserId());
        return Result.success(list);
    }
}
