package teektok.dto.audit;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminVideoVO {
    private Long videoId;
    private String title;
    private String videoUrl;
    private String coverUrl;
    private String description;
    private Long uploaderId;
    private Integer status;
    private Integer isHot;
    private Integer isDeleted;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Long playCount;
    private Long likeCount;
    private Long commentCount;
    private Long shareCount;
    private Long favoriteCount;
}

