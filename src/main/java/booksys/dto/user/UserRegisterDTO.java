package booksys.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "用户注册请求")
public class UserRegisterDTO {
    @Schema(description = "用户名", example = "zhangsan")
    private String username;

    @Schema(description = "密码", example = "123456")
    private String password;
}
