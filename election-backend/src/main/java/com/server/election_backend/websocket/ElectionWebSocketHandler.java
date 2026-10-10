package com.server.election_backend.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.server.election_backend.service.VotingService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ElectionWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();
    private final VotingService votingService;

    public ElectionWebSocketHandler(VotingService votingService) {
        this.votingService = votingService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.put(session.getId(), session);

        // When a new dashboard connects, send them the current totals immediately
        String initialData = mapper.writeValueAsString(Map.of(
                "type", "INITIAL_DATA",
                "candidates", votingService.getAllCandidates()
        ));
        session.sendMessage(new TextMessage(initialData));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode payload = mapper.readTree(message.getPayload());

        if ("CAST_VOTE".equals(payload.get("type").asText())) {
            String clientIp = (String) session.getAttributes().get("clientIp");
            String candidateId = payload.get("candidateId").asText();

            try {
                // Try to process the vote
                boolean stateChanged = votingService.processVote(clientIp, candidateId);

                if (stateChanged) {
                    broadcastLiveUpdate();
                }
            } catch (SecurityException | IllegalStateException e) {
                // CATCH BOTH EXCEPTIONS HERE!
                // This sends the error back to React nicely instead of crashing the server thread
                session.sendMessage(new TextMessage(mapper.writeValueAsString(Map.of(
                        "type", "ERROR",
                        "message", e.getMessage()
                ))));
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session.getId());
    }

    public void broadcastLiveUpdate() {
        try {
            String payload = mapper.writeValueAsString(Map.of(
                    "type", "LIVE_UPDATE",
                    "candidates", votingService.getAllCandidates()
            ));
            TextMessage message = new TextMessage(payload);

            for (WebSocketSession s : sessions.values()) {
                if (s.isOpen()) {
                    s.sendMessage(message);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}