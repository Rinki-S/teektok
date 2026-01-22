package teektok.dto.recommend;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "获取热门短视频推荐信息")
public class RecommendVideoVO {
    @Schema(description = "视频ID")
    private Long id;

    @Schema(description = "视频标题")
    private String title;

    @Schema(description = "视频播放地址")
    private String videoUrl;

    @Schema(description = "封面图地址")
    private String coverUrl;

    // --- 互动数据 ---
    @Schema(description = "点赞数")
    private Long likeCount;

    @Schema(description = "评论数")
    private Long commentCount;

    @Schema(description = "收藏数")
    private Long favoriteCount;

    @Schema(description = "分享数")
    private Long shareCount;



}
