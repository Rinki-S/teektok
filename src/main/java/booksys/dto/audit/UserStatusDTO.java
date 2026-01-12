package booksys.dto.audit;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "用户状态修改请求")
public class UserStatusDTO {
    @Schema(description = "用户ID", example = "1")
    private Integer userId;

    @Schema(description = "用户状态：0冻结 1正常", example = "0")
    private Integer status;
}
