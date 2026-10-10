package com.server.election_backend.service;

import com.server.election_backend.entity.ElectionSettings;
import com.server.election_backend.entity.VoteRecord;
import com.server.election_backend.entity.Candidate;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VotingService {

    private final MongoTemplate mongoTemplate;

    public VotingService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public List<Candidate> getAllCandidates() {
        return mongoTemplate.findAll(Candidate.class);
    }

    // Classify the IP into a specific demographic/network
    private String classifyNetwork(String ipAddress) {
        if (ipAddress.startsWith("192.168.1.")) return "Computer Science Dept";
        if (ipAddress.startsWith("10.0.")) return "Campus Dorms";
        if (ipAddress.equals("127.0.0.1") || ipAddress.equals("0:0:0:0:0:0:0:1")) return "Local Admin";
        return "External / Public";
    }

    @Transactional
    public boolean processVote(String ipAddress, String newCandidateId) {
        if (!isElectionOpen()) {
            throw new IllegalStateException("The election is currently closed.");
        }
        String networkGroup = classifyNetwork(ipAddress);

        Query ipQuery = new Query(Criteria.where("ipAddress").is(ipAddress));
        VoteRecord existingVote = mongoTemplate.findOne(ipQuery, VoteRecord.class);

        if (existingVote == null) {
            mongoTemplate.insert(new VoteRecord(ipAddress, newCandidateId));
            incrementCandidate(newCandidateId, networkGroup, 1);
            return true;
        }

        String oldCandidateId = existingVote.getCandidateId();
        if (oldCandidateId.equals(newCandidateId)) {
            return false;
        }

        // Decrement old, Increment new
        incrementCandidate(oldCandidateId, networkGroup, -1);
        incrementCandidate(newCandidateId, networkGroup, 1);

        Update update = new Update().set("candidateId", newCandidateId).set("timestamp", java.time.Instant.now());
        mongoTemplate.updateFirst(ipQuery, update, VoteRecord.class);

        return true;
    }

    // Updates both the total count AND the specific network bucket atomically
    private void incrementCandidate(String candidateId, String networkGroup, int amount) {
        Query query = new Query(Criteria.where("_id").is(candidateId));

        Update update = new Update()
                .inc("voteCount", amount)
                .inc("networkBreakdown." + networkGroup, amount); // MongoDB dot-notation for maps

        mongoTemplate.updateFirst(query, update, Candidate.class);
    }
    // Call this in your @PostConstruct seed method to ensure it exists
    public void initializeSettings() {
        if (mongoTemplate.findById("global_settings", ElectionSettings.class) == null) {
            mongoTemplate.insert(new ElectionSettings(true));
        }
    }

    public boolean isElectionOpen() {
        ElectionSettings settings = mongoTemplate.findById("global_settings", ElectionSettings.class);
        return settings != null && settings.isOpen();
    }

    public void setElectionStatus(boolean isOpen) {
        Query query = new Query(Criteria.where("_id").is("global_settings"));
        Update update = new Update().set("isOpen", isOpen);
        mongoTemplate.upsert(query, update, ElectionSettings.class);
    }
    public Candidate addCandidate(String name, String partyColor) {
        // Generate a random ID like "cand_a1b2c3d4"
        String randomId = "cand_" + java.util.UUID.randomUUID().toString().substring(0, 8);

        Candidate newCandidate = new Candidate(randomId, name, partyColor);
        return mongoTemplate.insert(newCandidate);
    }
}