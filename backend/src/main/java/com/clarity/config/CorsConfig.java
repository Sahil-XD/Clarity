package com.clarity.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // desktop Tauri app + Expo dev server + Expo Go
                .allowedOrigins(
                        "http://localhost:5173",      // Vite dev
                        "http://localhost:8081",      // Expo dev
                        "http://localhost:19000",     // Expo Go
                        "http://localhost:19006",     // Expo web
                        "tauri://localhost",          // Tauri
                        "exp://localhost:19000"       // Expo scheme
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
