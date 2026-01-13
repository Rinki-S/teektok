package teektok.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("comment")
public class Comment {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long videoId;

    private Long userId;

    private String content;

    /**
     * 父评论ID（可选，用于回复功能）
     */
    private Long parentId;

    private LocalDateTime createTime;
}