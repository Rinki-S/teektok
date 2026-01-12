package teektok.dto.video;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频列表项")
public class VideoListVO {
    @Schema(description = "视频ID")
    private Integer videoId;

    @Schema(description = "视频标题")
    private String title;

    @Schema(description = "播放量")
    private Integer playCount;
}
