package com.smartcampus.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        Path uploadDirPath = Paths.get(uploadDir);
        String location = uploadDirPath.toAbsolutePath().toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";
        }
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
