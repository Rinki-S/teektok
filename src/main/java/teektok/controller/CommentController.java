package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import teektok.VO.CommentVO;
import teektok.VO.PageResult;
import teektok.dto.commen.Result;
import teektok.service.IBehaviorService;

@Tag(name = "评论模块", description = "评论列表查询")
@RestController
@RequestMapping("/api/comment")
public class CommentController {

    @Autowired
    private IBehaviorService behaviorService;

    @Operation(summary = "获取评论列表")
    @GetMapping("/list")
    public Result<PageResult<CommentVO>> list(
            @RequestParam("videoId") Long videoId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        PageResult<CommentVO> result = behaviorService.listComments(videoId, page, size);
        return Result.success(result);
    }
}
