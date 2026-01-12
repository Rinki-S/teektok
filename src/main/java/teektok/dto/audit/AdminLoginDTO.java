package teektok.dto.audit;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "管理员登录请求")
public class AdminLoginDTO {
    private String username;
    private String password;
}
