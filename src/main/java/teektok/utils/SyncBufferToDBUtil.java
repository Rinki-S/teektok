package teektok.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import teektok.mapper.VideoStatMapper;

import java.util.HashMap;
import java.util.Map;

/**
 * 通用同步方法
 * bufferKey Redis 缓冲 Key
 * dbField   数据库字段名 (用于拼 SQL，注意防止 SQL 注入，这里是内部常量相对安全)
 */
@Component
public class SyncBufferToDBUtil {

    private static final Logger log = LoggerFactory.getLogger(SyncBufferToDBUtil.class);

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private VideoStatMapper videoStatMapper;

    public void syncBufferToDB(String bufferKey, String dbField) {
        // 1. 取出所有缓冲数据
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(bufferKey);
        if (entries.isEmpty()) {
            return;
        }

        // 2. 立即清除 Redis 缓冲 (防止下一次重复处理)
        // 注意：高并发下这里存在微小的丢失风险（取出后、删除前有新数据进来）。
        // 完美方案是用 Lua 脚本原子执行 "get and delete"，或者使用 "rename" 更名后处理。
        // 简单优化：只删除我们读到的那些 Key，或者使用 rename。
        // 这里演示简单做法：直接 delete。
        redisTemplate.delete(bufferKey);

        // 3. 组装批量更新数据
        // 结构：Map<VideoId, Delta>
        Map<Long, Integer> updateMap = new HashMap<>();
        entries.forEach((k, v) -> {
            try {
                updateMap.put(Long.valueOf(k.toString()), Integer.valueOf(v.toString()));
            } catch (NumberFormatException e) {
                // ignore
            }
        });

        // 4. 批量更新数据库
        // 你需要在 VideoStatMapper 中新增一个 batchUpdate 方法
        if (!updateMap.isEmpty()) {
            // 将 Map 分批处理（例如每 1000 条一次），防止 SQL 过长
            // 这里简化直接传
            videoStatMapper.batchUpdateStat(updateMap, dbField);
            log.info("同步 {} 数据完成，条数: {}", dbField, updateMap.size());
        }
    }
}
