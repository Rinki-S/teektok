package teektok.dto.behavior;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "转发/分享请求")
public class ShareDTO {
    @Schema(description = "视频ID", example = "1")
    private Long videoId;
}
