package teektok.dto.audit;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频审核请求")
public class VideoAuditDTO {
    @Schema(description = "视频ID", example = "1")
    private Integer videoId;

    @Schema(description = "审核结果：1通过 0拒绝", example = "1")
    private Integer status;
}
