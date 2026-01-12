package booksys.dto.video;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频列表查询参数")
public class VideoQueryDTO {
    @Schema(description = "页码", example = "1")
    private Integer page;

    @Schema(description = "每页大小", example = "10")
    private Integer size;
}
