package teektok.dto.video;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频信息响应")
public class VideoVO {
    private Long videoId;
    private String title;
    private String videoUrl;
    private String coverUrl;
    private Long playCount;
    private Long likeCount;
    private Long commentCount;
    private Long shareCount;
    private Long favoriteCount;

    @Schema(description = "视频描述")
    private String description;

    @Schema(description = "上传者ID")
    private Long uploaderId;

    @Schema(description = "上传者昵称")
    private String uploaderName;

    @Schema(description = "上传者头像")
    private String uploaderAvatar;
}
