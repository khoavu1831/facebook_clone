package com.example.facebook_clone.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
import org.springframework.scheduling.concurrent.DefaultManagedTaskScheduler;
import org.springframework.lang.NonNull;

/**
 * Cấu hình WebSocket cho giao tiếp thời gian thực
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Cấu hình message broker
     *
     * @param config Đối tượng cấu hình MessageBrokerRegistry
     */
    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic")
            .setHeartbeatValue(new long[]{25000, 25000})
            .setTaskScheduler(new DefaultManagedTaskScheduler());
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Đăng ký các endpoint STOMP
     *
     * @param registry Đối tượng đăng ký StompEndpointRegistry
     */
    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:3000")
                .withSockJS()
                .setStreamBytesLimit(512 * 1024)
                .setHttpMessageCacheSize(1000)
                .setDisconnectDelay(30 * 1000)
                .setHeartbeatTime(25000);
    }

    /**
     * Cấu hình vận chuyển WebSocket
     *
     * @param registration Đối tượng cấu hình WebSocketTransportRegistration
     */
    @Override
    public void configureWebSocketTransport(@NonNull WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(512 * 1024)
                   .setSendBufferSizeLimit(1024 * 1024)
                   .setSendTimeLimit(20000);
    }
}

