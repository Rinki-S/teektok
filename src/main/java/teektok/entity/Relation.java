package teektok.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("relation")
public class Relation {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;     // 粉丝ID
    private Long targetId;   // 被关注者ID
    private LocalDateTime createTime;
}
