package teektok.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("dm_message")
public class DmMessage {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long senderId;

    private Long receiverId;

    private Integer msgType;

    private String content;

    private Long videoId;

    private Integer isRead;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createTime;
}
