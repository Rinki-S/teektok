package teektok.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import teektok.mapper.VideoStatMapper;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

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
        String tempKey = bufferKey + ":temp:" + System.currentTimeMillis();

        // 1. 原子重命名
        try {
            if (Boolean.FALSE.equals(redisTemplate.hasKey(bufferKey))) {
                return;
            }
            redisTemplate.rename(bufferKey, tempKey);
        } catch (Exception e) {
            // 此时可能被别的线程处理了，或者 Key 不存在
            return;
        }

        // 2. 【兜底】给临时 Key 设置个过期时间 (如 10分钟)
        // 防止程序刚好在这里宕机，导致 tempKey 永久占用内存
        redisTemplate.expire(tempKey, 10, TimeUnit.MINUTES);

        try {
            // 3. 读取数据 (使用标准 API，代码清爽)
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(tempKey);

            Map<Long, Integer> updateMap = new HashMap<>();
            entries.forEach((k, v) -> {
                try {
                    updateMap.put(Long.valueOf(k.toString()), Integer.valueOf(v.toString()));
                } catch (NumberFormatException e) { /* ignore */ }
            });

            // 4. 落库
            if (!updateMap.isEmpty()) {
                videoStatMapper.batchInsertIgnore(updateMap.keySet());
                videoStatMapper.batchUpdateStat(updateMap, dbField);
            }
        } finally {
            // 5. 确保删除临时 Key
            redisTemplate.delete(tempKey);
        }
    }
}
