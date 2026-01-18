package teektok.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("recommendation_result")
public class RecommendationResult {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long movieId; // 对应系统中的 videoId

    private Double score; // 推荐分数

    private Integer rank; // 排名

    private String type; // OFFLINE 或 REALTIME

    private String reason; // 推荐理由

    private String modelId; //关联的模型ID（离线推荐使用）

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
