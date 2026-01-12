package booksys.dto.audit;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "设置热门视频请求")
public class VideoHotDTO {
    @Schema(description = "视频ID")
    private Integer videoId;

    @Schema(description = "是否热门：1是 0否")
    private Integer isHot;
}
