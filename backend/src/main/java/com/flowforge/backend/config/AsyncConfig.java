package com.flowforge.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    private final AppProperties appProperties;

    public AsyncConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(appProperties.getAsync().getCorePoolSize());
        executor.setMaxPoolSize(appProperties.getAsync().getMaxPoolSize());
        executor.setQueueCapacity(appProperties.getAsync().getQueueCapacity());
        executor.setThreadNamePrefix("FlowForge-Async-");
        executor.initialize();
        return executor;
    }
}
