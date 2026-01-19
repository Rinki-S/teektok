package teektok;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("teektok.mapper")
@EnableAsync    //开启异步支持
@EnableScheduling
public class teektokApplication {

    public static void main(String[] args) {
        SpringApplication.run(teektokApplication.class, args);
    }

}
