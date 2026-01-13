package teektok.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("video_stat")
public class VideoStat {
    /**
     * 视频ID (主键，不自增，与 video 表 id 一致)
     */
    @TableId
    private Long videoId;

    private Long playCount;

    private Long likeCount;

    private Long commentCount;

    private Long shareCount;

    private Long favoriteCount;
}