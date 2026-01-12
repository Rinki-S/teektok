package booksys.dto.video;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频信息响应")
public class VideoVO {
    private Integer id;

    private String title;

    private String videoUrl;

    private String coverUrl;

    private String description;

    private Integer playCount;

    private Integer likeCount;

    private Integer commentCount;
}
