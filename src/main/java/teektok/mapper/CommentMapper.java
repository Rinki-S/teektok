package teektok.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;
import teektok.entity.Comment;

@Mapper
public interface CommentMapper extends BaseMapper<Comment> {
    @Update("update comment set like_count = like_count + #{count} where id = #{commentId}")
    void incrLikeCount(@Param("commentId") Long commentId, @Param("count") Integer count);
}