package booksys.dto.recommend;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "获取热门短视频推荐信息")
public class RecommendVideoVO {
    @Schema(description = "视频ID")
    private Integer videoId;

    @Schema(description = "视频标题")
    private String title;

    @Schema(description = "点赞统计")
    private Integer likeCount;
}
