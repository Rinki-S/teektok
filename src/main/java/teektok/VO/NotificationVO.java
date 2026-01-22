package teektok.VO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationVO {
    private Long id;
    private Long actorId;
    private String actorUsername;
    private String actorAvatar;
    private Integer type;
    private Integer targetType;
    private Long targetId;
    private String content;
    private Integer isRead;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createTime;
}
