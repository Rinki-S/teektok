package booksys.dto.comment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "发表评论请求")
public class CommentCreateDTO {
    @Schema(description = "视频ID", example = "1")
    private Integer videoId;

    @Schema(description = "评论内容", example = "这个视频很好看")
    private String content;
}
