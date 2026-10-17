package com.server.election_backend.controller;

import com.server.election_backend.entity.Election;
import com.server.election_backend.service.VotingService;
import com.server.election_backend.websocket.ElectionWebSocketHandler;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/elections")
public class ElectionController {

    private final VotingService votingService;
    private final ElectionWebSocketHandler webSocketHandler;

    public ElectionController(VotingService votingService, ElectionWebSocketHandler webSocketHandler) {
        this.votingService = votingService;
        this.webSocketHandler = webSocketHandler;
    }

    private String resolveClientIp(HttpServletRequest request, String overrideIp) {
        if (overrideIp != null && !overrideIp.trim().isEmpty()) {
            return votingService.normalizeIp(overrideIp);
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            return votingService.normalizeIp(xForwardedFor);
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.trim().isEmpty()) {
            return votingService.normalizeIp(xRealIp);
        }

        return votingService.normalizeIp(request.getRemoteAddr());
    }

    @GetMapping("/me/ip")
    public Map<String, Object> getMyNetworkInfo(HttpServletRequest request,
                                               @RequestParam(required = false) String testIp) {
        String clientIp = resolveClientIp(request, testIp);
        String networkGroup = votingService.classifyNetwork(clientIp, null);
        return Map.of(
                "ip", clientIp,
                "networkGroup", networkGroup
        );
    }

    @GetMapping
    public Map<String, Object> getAccessibleElections(HttpServletRequest request,
                                                     @RequestParam(required = false) String clientIp) {
        String effectiveIp = resolveClientIp(request, clientIp);
        List<Election> elections = votingService.getElectionsForIp(effectiveIp);

        Map<String, Object> result = new HashMap<>();
        result.put("clientIp", effectiveIp);
        result.put("networkGroup", votingService.classifyNetwork(effectiveIp, null));
        result.put("elections", elections);
        return result;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getElectionById(@PathVariable String id,
                                            HttpServletRequest request,
                                            @RequestParam(required = false) String clientIp) {
        String effectiveIp = resolveClientIp(request, clientIp);
        Election election = votingService.getElectionById(id);

        if (election == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Election not found"));
        }

        if (!votingService.isIpAllowed(effectiveIp, election)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Your IP address (" + effectiveIp + ") is not authorized to access this election."
            ));
        }

        return ResponseEntity.ok(election);
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<?> castVote(@PathVariable String id,
                                      @RequestBody Map<String, String> payload,
                                      HttpServletRequest request) {
        String clientIp = resolveClientIp(request, payload.get("clientIp"));
        String candidateId = payload.get("candidateId");

        if (candidateId == null || candidateId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "candidateId is required."));
        }

        try {
            boolean changed = votingService.processVote(id, clientIp, candidateId);
            webSocketHandler.broadcastLiveUpdate();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "stateChanged", changed,
                    "message", changed ? "Vote successfully recorded." : "Vote was already recorded for this candidate."
            ));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }
}
