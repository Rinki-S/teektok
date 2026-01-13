package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import teektok.dto.audit.*;
import teektok.dto.commen.Result;
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
}
