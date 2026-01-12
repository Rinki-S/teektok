package booksys.dto.behavior;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

//点赞、收藏、转发通用

@Data
@Schema(description = "用户行为请求")
public class BehaviorDTO {
    @Schema(description = "视频ID", example = "1")
    private Integer videoId;
}
