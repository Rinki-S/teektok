package teektok.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Configuration
public class ThreadPoolConfig {

    @Bean("commonExecutor")
    public ThreadPoolExecutor commonExecutor() {
        // 参数说明：
        // 核心线程数：CPU核数 * 2 (IO密集型通常设置较大)
        int corePoolSize = Runtime.getRuntime().availableProcessors() * 2;
        // 最大线程数
        int maxPoolSize = corePoolSize * 2;
        // 队列容量
        int queueCapacity = 500;
        // 空闲线程存活时间
        long keepAliveTime = 60;

        return new ThreadPoolExecutor(
                corePoolSize,
                maxPoolSize,
                keepAliveTime,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(queueCapacity),
                new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略：由调用线程处理（防止丢任务）
        );
    }
}