package com.smartcampus.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        // prefix for messages from server to client
        config.enableSimpleBroker("/topic", "/queue");
        // prefix for messages from client to server
        config.setApplicationDestinationPrefixes("/app");
        // user-specific prefix
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // the endpoint where clients connect
        registry.addEndpoint("/ws-campus")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
