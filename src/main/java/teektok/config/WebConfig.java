package teektok.config;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import teektok.interceptor.TokenInterceptor;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private TokenInterceptor tokenInterceptor;

    @Autowired
    private MediaProperties mediaProperties;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tokenInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                    "/api/user/login",
                    "/api/user/register",
                    "/api/behavior/play",
                    "/api/admin/**",
                    "/api/analysis/**"
                );
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String localDir = mediaProperties.getLocalDir();
        if (localDir == null || localDir.isBlank()) return;

        Path dir = Paths.get(localDir).normalize().toAbsolutePath();
        String location = dir.toUri().toString();
        registry.addResourceHandler("/uploads/**").addResourceLocations(location.endsWith("/") ? location : location + "/");
    }
}
