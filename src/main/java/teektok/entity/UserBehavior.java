package teektok.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_behavior")
public class UserBehavior {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long videoId;

    /**
     * 行为类型：1播放 2点赞 3收藏 4评论 5转发
     */
    private Integer behaviorType;

    private LocalDateTime createTime;
}