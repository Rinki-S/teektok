package teektok.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "用户登录响应")
public class UserLoginVO {
    @Schema(description = "用户ID", example = "1")
    private Integer userId;

    @Schema(description = "登录令牌", example = "xxxxxx")
    private String token;
}
