package teektok.dto.video;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频信息响应")
public class VideoVO {
    private Long videoId;
    private String title;
    private String coverUrl;
    private Long playCount;
    private Long likeCount;
}
