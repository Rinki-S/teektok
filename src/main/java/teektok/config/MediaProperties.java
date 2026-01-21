package teektok.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "teektok.media")
public class MediaProperties {
    private String baseUrl;
    private String localDir;
}

