package teektok.dto.analysis;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频行为统计数据")
public class VideoAnalysisVO {
    private Long playCount;
    private Long likeCount;
    private Long commentCount;
}
