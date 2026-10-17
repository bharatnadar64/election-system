package com.server.election_backend.controller;

import com.server.election_backend.entity.Candidate;
import com.server.election_backend.entity.Election;
import com.server.election_backend.entity.VoteRecord;
import com.server.election_backend.service.VotingService;
import com.server.election_backend.websocket.ElectionWebSocketHandler;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final VotingService votingService;
    private final MongoTemplate mongoTemplate;
    private final ElectionWebSocketHandler webSocketHandler;

    public AdminController(VotingService votingService,
                           MongoTemplate mongoTemplate,
                           ElectionWebSocketHandler webSocketHandler) {
        this.votingService = votingService;
        this.mongoTemplate = mongoTemplate;
        this.webSocketHandler = webSocketHandler;
    }

    // --- Election Management ---

    @GetMapping("/elections")
    public List<Election> getAllElections() {
        return votingService.getAllElections();
    }

    @GetMapping("/elections/{id}")
    public ResponseEntity<?> getElection(@PathVariable String id) {
        Election election = votingService.getElectionById(id);
        if (election == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(election);
    }

    @PostMapping("/elections")
    public Election createElection(@RequestBody Map<String, Object> payload) {
        String title = (String) payload.get("title");
        String description = (String) payload.get("description");
        String networkType = (String) payload.getOrDefault("networkType", "ALL");
        @SuppressWarnings("unchecked")
        List<String> allowedIps = (List<String>) payload.get("allowedIps");
        String networkLabel = (String) payload.get("networkLabel");

        @SuppressWarnings("unchecked")
        List<String> candidateIds = (List<String>) payload.get("candidateIds");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> newCandidates = (List<Map<String, String>>) payload.get("newCandidates");

        Election created = votingService.createElection(title, description, networkType, allowedIps, networkLabel, candidateIds, newCandidates);
        webSocketHandler.broadcastLiveUpdate();
        return created;
    }

    @PutMapping("/elections/{id}")
    public Election updateElection(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        String title = (String) payload.get("title");
        String description = (String) payload.get("description");
        String networkType = (String) payload.get("networkType");
        @SuppressWarnings("unchecked")
        List<String> allowedIps = (List<String>) payload.get("allowedIps");
        String networkLabel = (String) payload.get("networkLabel");

        Election updated = votingService.updateElection(id, title, description, networkType, allowedIps, networkLabel);
        webSocketHandler.broadcastLiveUpdate();
        return updated;
    }

    @PostMapping("/elections/{id}/status")
    public Map<String, Object> setElectionStatus(@PathVariable String id, @RequestParam boolean open) {
        boolean ok = votingService.setElectionStatus(id, open);
        if (ok) {
            webSocketHandler.broadcastLiveUpdate();
        }
        return Map.of("success", ok, "isOpen", open);
    }

    @DeleteMapping("/elections/{id}")
    public Map<String, Object> deleteElection(@PathVariable String id) {
        boolean deleted = votingService.deleteElection(id);
        if (deleted) {
            webSocketHandler.broadcastLiveUpdate();
        }
        return Map.of("success", deleted);
    }

    @PostMapping("/elections/{id}/candidates")
    public Election addCandidateToElection(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String memberId = payload.get("memberId");
        String name = payload.get("name");
        String partyColor = payload.get("partyColor");

        Election updated = votingService.addCandidateToElection(id, memberId, name, partyColor);
        webSocketHandler.broadcastLiveUpdate();
        return updated;
    }

    @DeleteMapping("/elections/{id}/candidates/{candidateId}")
    public Election removeCandidateFromElection(@PathVariable String id, @PathVariable String candidateId) {
        Election updated = votingService.removeCandidateFromElection(id, candidateId);
        webSocketHandler.broadcastLiveUpdate();
        return updated;
    }

    // --- Network-Wise Vote Analytics with Grouping Options ---

    @GetMapping("/elections/{id}/insights/network-votes")
    public Map<String, Object> getNetworkVoteAnalytics(@PathVariable String id) {
        return votingService.getNetworkVoteAnalytics(id);
    }

    // --- Member Directory Management ---

    @GetMapping("/members")
    public List<Candidate> getAllMembers() {
        return votingService.getAllCandidates();
    }

    @PostMapping("/members")
    public Candidate addMember(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String partyColor = payload.getOrDefault("partyColor", "#3b82f6");
        return votingService.addCandidate(name, partyColor);
    }

    // --- Legacy Candidate Endpoints (Preserved for compatibility) ---

    @PostMapping("/candidates")
    public Candidate addCandidate(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String partyColor = payload.get("partyColor");
        Candidate savedCandidate = votingService.addCandidate(name, partyColor);
        webSocketHandler.broadcastLiveUpdate();
        return savedCandidate;
    }

    @PostMapping("/status")
    public Map<String, String> setGlobalElectionStatus(@RequestParam boolean open) {
        votingService.setElectionStatus(open);
        webSocketHandler.broadcastLiveUpdate();
        return Map.of("message", "Global election is now " + (open ? "OPEN" : "CLOSED"));
    }

    @GetMapping("/status")
    public Map<String, Boolean> getGlobalElectionStatus() {
        return Map.of("isOpen", votingService.isElectionOpen());
    }

    @GetMapping("/insights/totals")
    public List<Candidate> getCandidateTotals() {
        return votingService.getAllCandidates();
    }

    @GetMapping("/insights/raw-ledger")
    public List<VoteRecord> getRawVoteLedger(@RequestParam(required = false) String electionId) {
        if (electionId != null && !electionId.trim().isEmpty()) {
            return mongoTemplate.find(new Query(Criteria.where("electionId").is(electionId)), VoteRecord.class);
        }
        return mongoTemplate.findAll(VoteRecord.class);
    }

    @GetMapping("/insights/metrics")
    public Map<String, Object> getMetrics() {
        long totalVotesCast = mongoTemplate.estimatedCount(VoteRecord.class);
        long totalElections = mongoTemplate.count(new Query(), Election.class);
        return Map.of(
                "totalUniqueVoters", totalVotesCast,
                "totalElections", totalElections,
                "status", votingService.isElectionOpen() ? "OPEN" : "CLOSED"
        );
    }
}