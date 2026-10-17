package com.server.election_backend.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.server.election_backend.entity.Election;
import com.server.election_backend.service.VotingService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ElectionWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private final VotingService votingService;

    public ElectionWebSocketHandler(VotingService votingService) {
        this.votingService = votingService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.put(session.getId(), session);

        String clientIp = (String) session.getAttributes().get("clientIp");
        if (clientIp == null) clientIp = "127.0.0.1";
        clientIp = votingService.normalizeIp(clientIp);

        List<Election> accessibleElections = votingService.getElectionsForIp(clientIp);

        Map<String, Object> initialPayload = new HashMap<>();
        initialPayload.put("type", "INITIAL_DATA");
        initialPayload.put("clientIp", clientIp);
        initialPayload.put("networkGroup", votingService.classifyNetwork(clientIp, null));
        initialPayload.put("elections", accessibleElections);

        // Backward compatibility for single election view
        if (!accessibleElections.isEmpty()) {
            initialPayload.put("candidates", accessibleElections.get(0).getCandidates());
            initialPayload.put("currentElectionId", accessibleElections.get(0).getId());
        } else {
            initialPayload.put("candidates", List.of());
        }

        session.sendMessage(new TextMessage(mapper.writeValueAsString(initialPayload)));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode payload = mapper.readTree(message.getPayload());
        String actionType = payload.has("type") ? payload.get("type").asText() : "";

        if ("CAST_VOTE".equals(actionType)) {
            String clientIp = (String) session.getAttributes().get("clientIp");
            if (clientIp == null) clientIp = "127.0.0.1";
            clientIp = votingService.normalizeIp(clientIp);

            String candidateId = payload.has("candidateId") ? payload.get("candidateId").asText() : null;
            String electionId = payload.has("electionId") && !payload.get("electionId").isNull()
                    ? payload.get("electionId").asText()
                    : null;

            if (candidateId == null || candidateId.trim().isEmpty()) {
                session.sendMessage(new TextMessage(mapper.writeValueAsString(Map.of(
                        "type", "ERROR",
                        "message", "Candidate ID is required."
                ))));
                return;
            }

            try {
                boolean stateChanged = votingService.processVote(electionId, clientIp, candidateId);

                if (stateChanged) {
                    broadcastLiveUpdate();
                } else {
                    session.sendMessage(new TextMessage(mapper.writeValueAsString(Map.of(
                            "type", "INFO",
                            "message", "Your vote was already registered for this candidate."
                    ))));
                }
            } catch (SecurityException | IllegalStateException | IllegalArgumentException e) {
                session.sendMessage(new TextMessage(mapper.writeValueAsString(Map.of(
                        "type", "ERROR",
                        "message", e.getMessage()
                ))));
            }
        } else if ("PING".equals(actionType)) {
            session.sendMessage(new TextMessage(mapper.writeValueAsString(Map.of("type", "PONG"))));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session.getId());
    }

    public void broadcastLiveUpdate() {
        for (WebSocketSession session : sessions.values()) {
            if (session.isOpen()) {
                try {
                    String clientIp = (String) session.getAttributes().get("clientIp");
                    if (clientIp == null) clientIp = "127.0.0.1";
                    clientIp = votingService.normalizeIp(clientIp);

                    List<Election> accessibleElections = votingService.getElectionsForIp(clientIp);

                    Map<String, Object> updatePayload = new HashMap<>();
                    updatePayload.put("type", "LIVE_UPDATE");
                    updatePayload.put("clientIp", clientIp);
                    updatePayload.put("networkGroup", votingService.classifyNetwork(clientIp, null));
                    updatePayload.put("elections", accessibleElections);

                    if (!accessibleElections.isEmpty()) {
                        updatePayload.put("candidates", accessibleElections.get(0).getCandidates());
                    }

                    session.sendMessage(new TextMessage(mapper.writeValueAsString(updatePayload)));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}