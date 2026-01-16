package teektok.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;
import teektok.entity.VideoStat;

@Mapper
public interface VideoStatMapper extends BaseMapper<VideoStat> {
    // 乐观锁/原子更新：增加点赞数
    @Update("UPDATE video_stat SET like_count = like_count + #{num} WHERE video_id = #{videoId}")
    void incrLikeCount(@Param("videoId") Long videoId, @Param("num") int num);

    // 增加收藏数
    @Update("UPDATE video_stat SET favorite_count = favorite_count + #{num} WHERE video_id = #{videoId}")
    void incrCollectCount(@Param("videoId") Long videoId, @Param("num") int num);

    // 增加分享数
    @Update("UPDATE video_stat SET share_count = share_count + #{num} WHERE video_id = #{videoId}")
    void incrShareCount(@Param("videoId") Long videoId, @Param("num") int num);

    // 增加播放数
    @Update("UPDATE video_stat SET play_count = play_count + #{num} WHERE video_id = #{videoId}")
    void incrPlayCount(@Param("videoId") Long videoId, @Param("num") int num);

    // 增加评论数
    @Update("UPDATE video_stat SET comment_count = comment_count + #{num} WHERE video_id = #{videoId}")
    void incrCommentCount(@Param("videoId") Long videoId, @Param("num") int num);
}