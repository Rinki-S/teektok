package teektok.dto.audit;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "管理员登录响应")
public class AdminLoginVO {
    private Long adminId;
    private String token;
}
