package booksys.dto.analysis;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频行为统计数据")
public class VideoAnalysisVO {
    private Integer playCount;
    private Integer likeCount;
    private Integer commentCount;
}
