package com.server.election_backend.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ElectionWebSocketHandler electionHandler;

    public WebSocketConfig(ElectionWebSocketHandler electionHandler) {
        this.electionHandler = electionHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(electionHandler, "/ws/election")
                .addInterceptors(new IpHandshakeInterceptor()) // Add the interceptor here
                .setAllowedOrigins("*");
    }
}