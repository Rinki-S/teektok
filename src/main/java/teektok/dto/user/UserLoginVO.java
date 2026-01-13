package teektok.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Schema(description = "用户登录响应")
public class UserLoginVO {
    @Schema(description = "用户ID", example = "1")
    private long userId;

    @Schema(description = "登录令牌", example = "xxxxxx")
    private String token;
}
