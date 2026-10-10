package com.server.election_backend.controller;

import com.server.election_backend.entity.Candidate;
import com.server.election_backend.entity.VoteRecord;
import com.server.election_backend.service.VotingService;
import com.server.election_backend.websocket.ElectionWebSocketHandler;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final VotingService votingService;
    private final MongoTemplate mongoTemplate;
    private final ElectionWebSocketHandler webSocketHandler; // Add this

    // Update the constructor
    public AdminController(VotingService votingService,
                           MongoTemplate mongoTemplate,
                           ElectionWebSocketHandler webSocketHandler) {
        this.votingService = votingService;
        this.mongoTemplate = mongoTemplate;
        this.webSocketHandler = webSocketHandler;
    }

    // --- NEW: Add a Candidate ---

    @PostMapping("/candidates")
    public Candidate addCandidate(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String partyColor = payload.get("partyColor");

        Candidate savedCandidate = votingService.addCandidate(name, partyColor);

        // Instantly push the updated candidate list to all connected React users!
        webSocketHandler.broadcastLiveUpdate();

        return savedCandidate;
    }
    // --- Control the Election ---

    @PostMapping("/status")
    public Map<String, String> setElectionStatus(@RequestParam boolean open) {
        votingService.setElectionStatus(open);
        return Map.of("message", "Election is now " + (open ? "OPEN" : "CLOSED"));
    }

    @GetMapping("/status")
    public Map<String, Boolean> getElectionStatus() {
        return Map.of("isOpen", votingService.isElectionOpen());
    }

    // --- Insights & Analytics ---

    @GetMapping("/insights/totals")
    public List<Candidate> getCandidateTotals() {
        return votingService.getAllCandidates();
    }

    @GetMapping("/insights/raw-ledger")
    public List<VoteRecord> getRawVoteLedger() {
        // Returns the raw vote log for auditing (who voted for whom and when)
        return mongoTemplate.findAll(VoteRecord.class);
    }

    @GetMapping("/insights/metrics")
    public Map<String, Object> getMetrics() {
        long totalVotesCast = mongoTemplate.estimatedCount(VoteRecord.class);
        return Map.of(
                "totalUniqueVoters", totalVotesCast,
                "status", votingService.isElectionOpen() ? "OPEN" : "CLOSED"
        );
    }
}