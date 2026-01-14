package teektok.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("video")
public class Video {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;

    private String videoUrl;

    private String coverUrl;

    private String description;

    private Long uploaderId;

/*    private Long playCount;

    private Long likeCount;*/

    /**
     * 审核状态：0待审核 1审核通过 2审核不通过
     */
    private Integer status;

    /**
     * 是否热门：0否 1是
     */
    private Integer isHot;

    /**
     * 逻辑删除：0未删除 1已删除
     * 加了 @TableLogic 后，调用 deleteById 会自动变成 update is_deleted=1
     */
    @TableLogic
    private Integer isDeleted;

    /**
     * 创建时间
     * fill = FieldFill.INSERT 表示插入时自动填充
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     * fill = FieldFill.INSERT_UPDATE 表示插入和更新时自动填充
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}