package teektok.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import teektok.entity.UserBehavior;

@Mapper
public interface UserBehaviorMapper extends BaseMapper<UserBehavior> {

    @Select("SELECT COUNT(DISTINCT video_id) " +
            "FROM user_behavior " +
            "WHERE user_id = #{userId} AND behavior_type = #{behaviorType}")
    long countDistinctVideoIdsByUserAndType(@Param("userId") Long userId, @Param("behaviorType") int behaviorType);

    @Select("SELECT video_id " +
            "FROM user_behavior " +
            "WHERE user_id = #{userId} AND behavior_type = #{behaviorType} " +
            "GROUP BY video_id " +
            "ORDER BY MAX(create_time) DESC " +
            "LIMIT #{offset}, #{size}")
    java.util.List<Long> selectDistinctVideoIdsByUserAndTypeOrderByLatestTime(
            @Param("userId") Long userId,
            @Param("behaviorType") int behaviorType,
            @Param("offset") long offset,
            @Param("size") long size
    );
}
