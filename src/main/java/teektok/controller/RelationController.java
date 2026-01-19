package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import teektok.dto.commen.Result;
import teektok.dto.relation.RelationActionDTO;
import teektok.entity.User;
import teektok.service.IRelationService;
import teektok.utils.BaseContext;

import java.util.List;

@Tag(name = "用户关系模块", description = "关注、粉丝、朋友")
@RestController
@RequestMapping("/api/relation")
public class RelationController {

    @Autowired
    private IRelationService relationService;

    private Long getCurrentUserId() {
        return BaseContext.getCurrentId();
    }

    @Operation(summary = "关注/取消关注操作")
    @PostMapping("/action")
    public Result<Void> action(@RequestBody RelationActionDTO dto) {
        Long userId = getCurrentUserId();
        if (dto.getActionType() == 1) {
            relationService.follow(userId, dto.getTargetId());
        } else if (dto.getActionType() == 2) {
            relationService.unfollow(userId, dto.getTargetId());
        }
        return Result.success();
    }

    @Operation(summary = "关注列表")
    @GetMapping("/follow/list")
    public Result<List<User>> followList() {
        return Result.success(relationService.getFollowList(getCurrentUserId()));
    }

    @Operation(summary = "粉丝列表")
    @GetMapping("/follower/list")
    public Result<List<User>> followerList() {
        return Result.success(relationService.getFollowerList(getCurrentUserId()));
    }

    @Operation(summary = "朋友列表")
    @GetMapping("/friend/list")
    public Result<List<User>> friendList() {
        return Result.success(relationService.getFriendList(getCurrentUserId()));
    }
}
