package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import teektok.VO.PageResult;
import teektok.dto.audit.*;
import teektok.dto.commen.Result;
import teektok.entity.User;
import teektok.service.IAdminService;

@Tag(name = "管理员模块")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private IAdminService adminService;

    @Operation(summary = "管理员登录")
    @PostMapping("/login")
    public Result<AdminLoginVO> login(@RequestBody AdminLoginDTO dto) {
        // 返回 Token
        AdminLoginVO vo = adminService.login(dto);
        return Result.success(vo);
    }

    @Operation(summary = "冻结/解封用户")
    @PostMapping("/user/status")
    public Result<Void> changeUserStatus(
            @RequestParam("userId") Long userId,
            @RequestParam("status") Integer status
            ) {
        adminService.ChangeUserStatus(userId, status);
        return Result.success();
    }

    @Operation(summary = "审核短视频")
    @PostMapping("/video/audit")
    public Result<Void> audit(@RequestBody VideoAuditDTO dto) {
        adminService.auditVideo(dto);
        return Result.success();
    }

    @Operation(summary = "设置/取消热门视频")
    @PostMapping("/video/hot")
    public Result<Void> setHot(
            @RequestParam("videoId") Long videoId,
            @RequestParam("hot") Boolean hot
    ) {
        adminService.setHotVideo(videoId, hot);
        return Result.success();
    }

    @Operation(summary = "删除违规视频")
    @DeleteMapping("/video/delete/{videoId}")
    public Result<Void> deleteVideo(@PathVariable("videoId") Long videoId) {
        adminService.deleteVideo(videoId);
        return Result.success();
    }


    @Operation(summary = "获取用户列表")
    @GetMapping("/user/list")
    public Result<PageResult<User>> getUserList(
            @RequestParam(value = "page", defaultValue = "1") Integer page,
            @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize
    ) {
        PageResult<User> result = adminService.getUserList(page, pageSize);
        return Result.success(result);
    }

    @Operation(summary = "获取视频列表（管理端）")
    @GetMapping("/video/list")
    public Result<PageResult<AdminVideoVO>> getVideoList(
            @RequestParam(value = "page", defaultValue = "1") Integer page,
            @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize,
            @RequestParam(value = "status", required = false) Integer status,
            @RequestParam(value = "isHot", required = false) Integer isHot
    ) {
        PageResult<AdminVideoVO> result = adminService.getVideoList(page, pageSize, status, isHot);
        return Result.success(result);
    }

    @Operation(summary = "获取视频详情（管理端）")
    @GetMapping("/video/{id}")
    public Result<AdminVideoVO> getVideoDetail(@PathVariable("id") Long id) {
        return Result.success(adminService.getVideoDetail(id));
    }
}
