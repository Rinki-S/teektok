package teektok.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import teektok.dto.commen.Result;
import teektok.dto.user.UserLoginDTO;
import teektok.dto.user.UserLoginVO;
import teektok.dto.user.UserMeVO;
import teektok.dto.user.UserRegisterDTO;
import teektok.service.IUserService;
import teektok.utils.BaseContext;

@RestController
@RequestMapping("/api/user")
@Tag(name = "用户模块")
public class UserController {

    private final IUserService userService;

    public UserController(IUserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public Result<Void> register(@RequestBody UserRegisterDTO userRegisterDTO) {
        userService.register(userRegisterDTO);
        return Result.success();
    }

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public Result<UserLoginVO> login(@RequestBody UserLoginDTO userLoginDTO) {
        UserLoginVO vo = userService.login(userLoginDTO);
        return Result.success(vo);
    }

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/me")
    public Result<UserMeVO> getMyInfo() {
        // 从拦截器解析出的上下文中获取当前登录用户ID
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            return Result.fail(401,"未登录");
        }

        UserMeVO vo = userService.getMyInfo(userId);
        return Result.success(vo);
    }

}
