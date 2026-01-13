package teektok;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("teektok.mapper")
public class teektokApplication {

    public static void main(String[] args) {
        SpringApplication.run(teektokApplication.class, args);
    }

}
