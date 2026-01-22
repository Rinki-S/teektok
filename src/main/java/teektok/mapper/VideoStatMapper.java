package teektok.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import teektok.dto.analysis.VideoAnalysisVO;
import teektok.entity.VideoStat;

import java.util.Map;
import java.util.Collection;

@Mapper
public interface VideoStatMapper extends BaseMapper<VideoStat> {
    // 乐观锁/原子更新：增加点赞数
    @Update("INSERT INTO video_stat (video_id, like_count, play_count, comment_count, share_count, favorite_count) " +
            "VALUES (#{videoId}, #{num}, 0, 0, 0, 0) " +
            "ON DUPLICATE KEY UPDATE like_count = like_count + #{num}")
    void incrLikeCount(@Param("videoId") Long videoId, @Param("num") int num);

    // 增加收藏数
    @Update("INSERT INTO video_stat (video_id, like_count, play_count, comment_count, share_count, favorite_count) " +
            "VALUES (#{videoId}, 0, 0, 0, 0, #{num}) " +
            "ON DUPLICATE KEY UPDATE favorite_count = favorite_count + #{num}")
    void incrCollectCount(@Param("videoId") Long videoId, @Param("num") int num);

    // 增加分享数
    @Update("INSERT INTO video_stat (video_id, like_count, play_count, comment_count, share_count, favorite_count) " +
            "VALUES (#{videoId}, 0, 0, 0, #{num}, 0) " +
            "ON DUPLICATE KEY UPDATE share_count = share_count + #{num}")
    void incrShareCount(@Param("videoId") Long videoId, @Param("num") int num);

    // 增加播放数
    @Update("INSERT INTO video_stat (video_id, like_count, play_count, comment_count, share_count, favorite_count) " +
            "VALUES (#{videoId}, 0, #{num}, 0, 0, 0) " +
            "ON DUPLICATE KEY UPDATE play_count = play_count + #{num}")
    void incrPlayCount(@Param("videoId") Long videoId, @Param("num") int num);

    // 增加评论数
    @Update("INSERT INTO video_stat (video_id, like_count, play_count, comment_count, share_count, favorite_count) " +
            "VALUES (#{videoId}, 0, 0, #{num}, 0, 0) " +
            "ON DUPLICATE KEY UPDATE comment_count = comment_count + #{num}")
    void incrCommentCount(@Param("videoId") Long videoId, @Param("num") int num);

    // 使用 Case When 语法进行批量更新
    // 示例 SQL: UPDATE video_stat SET play_count = play_count + CASE video_id WHEN 1 THEN 10 WHEN 2 THEN 5 END WHERE video_id IN (1, 2)
    void batchUpdateStat(@Param("stats") Map<Long, Integer> stats, @Param("field") String field);

    void batchInsertIgnore(@Param("videoIds") Collection<Long> videoIds);

    @Select("SELECT COALESCE(SUM(play_count),0) AS playCount, COALESCE(SUM(like_count),0) AS likeCount, COALESCE(SUM(comment_count),0) AS commentCount FROM video_stat")
    VideoAnalysisVO sumAll();
}
