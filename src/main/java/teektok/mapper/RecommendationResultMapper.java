package teektok.mapper;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import teektok.entity.RecommendationResult;

import java.util.Date;
import java.util.List;

/**
 * 推荐结果 Mapper
 */
@Mapper
public interface RecommendationResultMapper extends BaseMapper<RecommendationResult> {
}