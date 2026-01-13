package teektok.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Video {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;

    private String url;

    private String coverUrl;

    private Long userId;

    private Long playCount;

    private Long likeCount;

    private Integer status;

    private LocalDateTime createTime;
}
