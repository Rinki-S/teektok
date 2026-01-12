package teektok.dto.behavior;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频播放请求")
public class PlayDTO {
    @Schema(description = "视频ID", example = "1")
    private Integer videoId;
}
