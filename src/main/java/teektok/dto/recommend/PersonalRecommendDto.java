package teektok.dto.recommend;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

//TODO：完成设计

@Data
@Schema(description = "获取个性化推荐请求")
public class PersonalRecommendDto {
    @Schema(description = "用户ID")
    private Long userId;
}
