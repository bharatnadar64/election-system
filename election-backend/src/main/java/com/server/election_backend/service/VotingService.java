package com.server.election_backend.service;

import com.server.election_backend.entity.Candidate;
import com.server.election_backend.entity.Election;
import com.server.election_backend.entity.ElectionCandidate;
import com.server.election_backend.entity.ElectionSettings;
import com.server.election_backend.entity.VoteRecord;
import jakarta.annotation.PostConstruct;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VotingService {

    private final MongoTemplate mongoTemplate;

    public VotingService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @PostConstruct
    public void init() {
        initializeSettings();
        dropLegacyVoteIndex();
        seedDefaultElectionIfNone();
    }

    private void dropLegacyVoteIndex() {
        try {
            mongoTemplate.getCollection("votes").dropIndex("ipAddress_1");
        } catch (Exception ignored) {
            // Index might not exist or already dropped
        }
    }

    public void initializeSettings() {
        if (mongoTemplate.findById("global_settings", ElectionSettings.class) == null) {
            mongoTemplate.insert(new ElectionSettings(true));
        }
    }

    private void seedDefaultElectionIfNone() {
        long count = mongoTemplate.count(new Query(), Election.class);
        if (count == 0) {
            List<Candidate> existingMembers = mongoTemplate.findAll(Candidate.class);
            if (existingMembers.isEmpty()) {
                Candidate c1 = addCandidate("Diana Prince", "#10b981");
                Candidate c2 = addCandidate("Bruce Wayne", "#6366f1");
                Candidate c3 = addCandidate("Clark Kent", "#ef4444");
                existingMembers = List.of(c1, c2, c3);
            }

            Election defaultElection = new Election(
                    "elec_default",
                    "General Campus Election 2026",
                    "Public general election for student leadership and campus representatives.",
                    "ALL",
                    List.of("*"),
                    "All Traffic (Public & Remote)"
            );

            List<ElectionCandidate> electionCandidates = new ArrayList<>();
            for (Candidate m : existingMembers) {
                electionCandidates.add(new ElectionCandidate(m.getId(), m.getName(), m.getPartyColor()));
            }
            defaultElection.setCandidates(electionCandidates);
            mongoTemplate.insert(defaultElection);
        }
    }

    // --- IP Matching & Classification Logic ---

    public String normalizeIp(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return "127.0.0.1";
        }
        String clean = ip.trim();
        if (clean.contains(",")) {
            clean = clean.split(",")[0].trim();
        }
        if (clean.equals("0:0:0:0:0:0:0:1") || clean.equals("::1")) {
            return "127.0.0.1";
        }
        return clean;
    }

    public boolean isIpAllowed(String rawIp, Election election) {
        if (election == null) return false;
        if ("ALL".equalsIgnoreCase(election.getNetworkType())) return true;

        List<String> allowed = election.getAllowedIps();
        if (allowed == null || allowed.isEmpty() || allowed.contains("*")
                || allowed.stream().anyMatch(s -> "all".equalsIgnoreCase(s.trim()))) {
            return true;
        }

        String normClient = normalizeIp(rawIp);

        for (String pattern : allowed) {
            if (pattern == null) continue;
            String p = pattern.trim();
            if (p.isEmpty()) continue;
            if (p.equals("*") || p.equalsIgnoreCase("all")) return true;

            String normPattern = normalizeIp(p);
            if (normClient.equalsIgnoreCase(normPattern)) return true;

            // Check wildcard prefix e.g. "192.168.1.*" or "10.0.*"
            if (p.endsWith(".*")) {
                String prefix = p.substring(0, p.length() - 1);
                if (normClient.startsWith(prefix)) return true;
            } else if (p.endsWith("*")) {
                String prefix = p.substring(0, p.length() - 1);
                if (normClient.startsWith(prefix)) return true;
            }
        }
        return false;
    }

    public String classifyNetwork(String rawIp, Election election) {
        String norm = normalizeIp(rawIp);

        if (election != null && election.getNetworkLabel() != null && !election.getNetworkLabel().trim().isEmpty()) {
            if (isIpAllowed(norm, election)) {
                return election.getNetworkLabel();
            }
        }

        if (norm.startsWith("192.168.1.")) return "Computer Science Dept (192.168.1.x)";
        if (norm.startsWith("192.168.")) return "Internal Subnet (192.168.x.x)";
        if (norm.startsWith("10.0.")) return "Campus Dorms (10.0.x)";
        if (norm.startsWith("10.")) return "Private Campus Network (10.x)";
        if (norm.equals("127.0.0.1")) return "Local Admin / Loopback";
        return "External / Public (" + norm + ")";
    }

    // --- Election Queries ---

    public List<Election> getAllElections() {
        return mongoTemplate.findAll(Election.class);
    }

    public List<Election> getElectionsForIp(String clientIp) {
        List<Election> all = getAllElections();
        return all.stream()
                .filter(e -> isIpAllowed(clientIp, e))
                .collect(Collectors.toList());
    }

    public Election getElectionById(String electionId) {
        return mongoTemplate.findById(electionId, Election.class);
    }

    // --- Election Management (Admin) ---

    public Election createElection(String title,
                                  String description,
                                  String networkType,
                                  List<String> allowedIps,
                                  String networkLabel,
                                  List<String> candidateIds,
                                  List<Map<String, String>> newCandidates) {

        String electionId = "elec_" + UUID.randomUUID().toString().substring(0, 8);
        Election election = new Election(electionId, title, description, networkType, allowedIps, networkLabel);

        List<ElectionCandidate> candidatesList = new ArrayList<>();

        // Add existing members selected from directory
        if (candidateIds != null) {
            for (String cid : candidateIds) {
                Candidate member = mongoTemplate.findById(cid, Candidate.class);
                if (member != null) {
                    candidatesList.add(new ElectionCandidate(member.getId(), member.getName(), member.getPartyColor()));
                }
            }
        }

        // Add and persist any new members created inline
        if (newCandidates != null) {
            for (Map<String, String> nc : newCandidates) {
                String name = nc.get("name");
                String color = nc.getOrDefault("partyColor", "#3b82f6");
                if (name != null && !name.trim().isEmpty()) {
                    Candidate savedMember = addCandidate(name.trim(), color);
                    candidatesList.add(new ElectionCandidate(savedMember.getId(), savedMember.getName(), savedMember.getPartyColor()));
                }
            }
        }

        election.setCandidates(candidatesList);
        return mongoTemplate.insert(election);
    }

    public Election updateElection(String electionId,
                                  String title,
                                  String description,
                                  String networkType,
                                  List<String> allowedIps,
                                  String networkLabel) {
        Election election = mongoTemplate.findById(electionId, Election.class);
        if (election == null) {
            throw new IllegalArgumentException("Election not found: " + electionId);
        }

        if (title != null) election.setTitle(title);
        if (description != null) election.setDescription(description);
        if (networkType != null) election.setNetworkType(networkType);
        if (allowedIps != null) election.setAllowedIps(allowedIps);
        if (networkLabel != null) election.setNetworkLabel(networkLabel);
        election.setUpdatedAt(Instant.now().toString());

        return mongoTemplate.save(election);
    }

    public boolean setElectionStatus(String electionId, boolean isOpen) {
        Election election = mongoTemplate.findById(electionId, Election.class);
        if (election == null) return false;
        election.setOpen(isOpen);
        election.setUpdatedAt(Instant.now().toString());
        mongoTemplate.save(election);
        return true;
    }

    public boolean deleteElection(String electionId) {
        Query query = new Query(Criteria.where("_id").is(electionId));
        Election deleted = mongoTemplate.findAndRemove(query, Election.class);
        if (deleted != null) {
            // Also clean up votes for this election
            mongoTemplate.remove(new Query(Criteria.where("electionId").is(electionId)), VoteRecord.class);
            return true;
        }
        return false;
    }

    public Election addCandidateToElection(String electionId, String memberId, String name, String color) {
        Election election = mongoTemplate.findById(electionId, Election.class);
        if (election == null) {
            throw new IllegalArgumentException("Election not found: " + electionId);
        }

        ElectionCandidate newCandidate;
        if (memberId != null && !memberId.trim().isEmpty()) {
            Candidate member = mongoTemplate.findById(memberId, Candidate.class);
            if (member == null) {
                throw new IllegalArgumentException("Member not found: " + memberId);
            }
            newCandidate = new ElectionCandidate(member.getId(), member.getName(), member.getPartyColor());
        } else {
            Candidate saved = addCandidate(name, color != null ? color : "#3b82f6");
            newCandidate = new ElectionCandidate(saved.getId(), saved.getName(), saved.getPartyColor());
        }

        // Check if candidate already in election
        boolean exists = election.getCandidates().stream().anyMatch(c -> c.getId().equals(newCandidate.getId()));
        if (!exists) {
            election.getCandidates().add(newCandidate);
            election.setUpdatedAt(Instant.now().toString());
            mongoTemplate.save(election);
        }

        return election;
    }

    public Election removeCandidateFromElection(String electionId, String candidateId) {
        Election election = mongoTemplate.findById(electionId, Election.class);
        if (election == null) {
            throw new IllegalArgumentException("Election not found: " + electionId);
        }
        election.getCandidates().removeIf(c -> c.getId().equals(candidateId));
        election.setUpdatedAt(Instant.now().toString());
        return mongoTemplate.save(election);
    }

    // --- Voting Logic ---

    @Transactional
    public boolean processVote(String electionId, String rawIp, String newCandidateId) {
        String clientIp = normalizeIp(rawIp);

        // If electionId is not specified, resolve to first open election accessible to this IP
        if (electionId == null || electionId.trim().isEmpty()) {
            List<Election> accessible = getElectionsForIp(clientIp);
            Optional<Election> firstOpen = accessible.stream().filter(Election::isOpen).findFirst();
            if (firstOpen.isEmpty()) {
                throw new IllegalStateException("No open election available for your network.");
            }
            electionId = firstOpen.get().getId();
        }

        Election election = mongoTemplate.findById(electionId, Election.class);
        if (election == null) {
            throw new IllegalStateException("Election not found: " + electionId);
        }

        if (!election.isOpen()) {
            throw new IllegalStateException("The election '" + election.getTitle() + "' is currently closed.");
        }

        if (!isIpAllowed(clientIp, election)) {
            throw new SecurityException("Your IP address (" + clientIp + ") is not authorized to vote in this election.");
        }

        String networkGroup = classifyNetwork(clientIp, election);

        Query voteQuery = new Query(Criteria.where("electionId").is(electionId).and("ipAddress").is(clientIp));
        VoteRecord existingVote = mongoTemplate.findOne(voteQuery, VoteRecord.class);

        if (existingVote == null) {
            // First vote in this election from this IP
            VoteRecord newVote = new VoteRecord(electionId, clientIp, newCandidateId, networkGroup);
            mongoTemplate.insert(newVote);
            incrementCandidateInElection(election, newCandidateId, networkGroup, 1);
            return true;
        }

        String oldCandidateId = existingVote.getCandidateId();
        if (oldCandidateId.equals(newCandidateId)) {
            return false; // Already voted for this candidate
        }

        // Change vote: Decrement old, increment new
        incrementCandidateInElection(election, oldCandidateId, networkGroup, -1);
        incrementCandidateInElection(election, newCandidateId, networkGroup, 1);

        Update update = new Update()
                .set("candidateId", newCandidateId)
                .set("networkGroup", networkGroup)
                .set("timestamp", Instant.now());
        mongoTemplate.updateFirst(voteQuery, update, VoteRecord.class);

        return true;
    }

    private void incrementCandidateInElection(Election election, String candidateId, String networkGroup, int amount) {
        if (election.getCandidates() == null) return;

        for (ElectionCandidate candidate : election.getCandidates()) {
            if (candidate.getId().equals(candidateId)) {
                candidate.setVoteCount(Math.max(0, candidate.getVoteCount() + amount));
                Map<String, Integer> nb = candidate.getNetworkBreakdown();
                if (nb == null) nb = new HashMap<>();

                int currentCount = nb.getOrDefault(networkGroup, 0);
                int newCount = Math.max(0, currentCount + amount);
                if (newCount == 0) {
                    nb.remove(networkGroup);
                } else {
                    nb.put(networkGroup, newCount);
                }
                candidate.setNetworkBreakdown(nb);
                break;
            }
        }
        election.setUpdatedAt(Instant.now().toString());
        mongoTemplate.save(election);
    }

    // --- Network-Wise Vote Analysis & Grouping ---

    public Map<String, Object> getNetworkVoteAnalytics(String electionId) {
        Election election = mongoTemplate.findById(electionId, Election.class);
        if (election == null) {
            throw new IllegalArgumentException("Election not found: " + electionId);
        }

        Query query = new Query(Criteria.where("electionId").is(electionId));
        List<VoteRecord> votes = mongoTemplate.find(query, VoteRecord.class);

        // Candidate lookup map for easy name resolution
        Map<String, ElectionCandidate> candidateMap = election.getCandidates().stream()
                .collect(Collectors.toMap(ElectionCandidate::getId, c -> c, (a, b) -> a));

        // 1. Group by Exact IP Address
        List<Map<String, Object>> groupByIp = new ArrayList<>();
        for (VoteRecord v : votes) {
            Map<String, Object> ipItem = new HashMap<>();
            ipItem.put("id", v.getId());
            ipItem.put("ipAddress", v.getIpAddress());
            ipItem.put("networkGroup", v.getNetworkGroup() != null ? v.getNetworkGroup() : classifyNetwork(v.getIpAddress(), election));
            ipItem.put("candidateId", v.getCandidateId());
            ElectionCandidate c = candidateMap.get(v.getCandidateId());
            ipItem.put("candidateName", c != null ? c.getName() : v.getCandidateId());
            ipItem.put("partyColor", c != null ? c.getPartyColor() : "#64748b");
            ipItem.put("timestamp", v.getTimestamp());
            groupByIp.add(ipItem);
        }

        // 2. Group by Network / Subnet Group
        Map<String, List<VoteRecord>> votesByNetwork = votes.stream()
                .collect(Collectors.groupingBy(v -> v.getNetworkGroup() != null ? v.getNetworkGroup() : classifyNetwork(v.getIpAddress(), election)));

        List<Map<String, Object>> groupByNetwork = new ArrayList<>();
        int totalVotesCount = votes.size();

        for (Map.Entry<String, List<VoteRecord>> entry : votesByNetwork.entrySet()) {
            String networkName = entry.getKey();
            List<VoteRecord> netVotes = entry.getValue();

            Map<String, Object> netData = new HashMap<>();
            netData.put("networkName", networkName);
            netData.put("voteCount", netVotes.size());
            netData.put("percentage", totalVotesCount > 0 ? Math.round(((double) netVotes.size() / totalVotesCount) * 1000.0) / 10.0 : 0);

            // Candidate breakdown inside this network
            Map<String, Integer> candidateCounts = new HashMap<>();
            Set<String> uniqueIps = new HashSet<>();
            for (VoteRecord nv : netVotes) {
                uniqueIps.add(nv.getIpAddress());
                ElectionCandidate cand = candidateMap.get(nv.getCandidateId());
                String candName = cand != null ? cand.getName() : nv.getCandidateId();
                candidateCounts.put(candName, candidateCounts.getOrDefault(candName, 0) + 1);
            }
            netData.put("candidateBreakdown", candidateCounts);
            netData.put("uniqueIpsCount", uniqueIps.size());
            netData.put("ips", new ArrayList<>(uniqueIps));

            groupByNetwork.add(netData);
        }

        // Sort groupByNetwork by vote count descending
        groupByNetwork.sort((a, b) -> Integer.compare((int) b.get("voteCount"), (int) a.get("voteCount")));

        // 3. Group by Candidate with Network & IP breakdown
        List<Map<String, Object>> groupByCandidate = new ArrayList<>();
        for (ElectionCandidate ec : election.getCandidates()) {
            Map<String, Object> cData = new HashMap<>();
            cData.put("candidateId", ec.getId());
            cData.put("name", ec.getName());
            cData.put("partyColor", ec.getPartyColor());
            cData.put("voteCount", ec.getVoteCount());
            cData.put("networkBreakdown", ec.getNetworkBreakdown() != null ? ec.getNetworkBreakdown() : Map.of());

            // Specific IPs that voted for this candidate
            List<Map<String, Object>> voterIps = votes.stream()
                    .filter(v -> v.getCandidateId().equals(ec.getId()))
                    .map(v -> Map.<String, Object>of(
                            "ipAddress", v.getIpAddress(),
                            "networkGroup", v.getNetworkGroup() != null ? v.getNetworkGroup() : classifyNetwork(v.getIpAddress(), election),
                            "timestamp", v.getTimestamp()
                    ))
                    .collect(Collectors.toList());
            cData.put("voters", voterIps);

            groupByCandidate.add(cData);
        }

        // Summary
        Set<String> allUniqueIps = votes.stream().map(VoteRecord::getIpAddress).collect(Collectors.toSet());
        Map<String, Object> summary = new HashMap<>();
        summary.put("electionId", election.getId());
        summary.put("title", election.getTitle());
        summary.put("description", election.getDescription());
        summary.put("isOpen", election.isOpen());
        summary.put("networkType", election.getNetworkType());
        summary.put("allowedIps", election.getAllowedIps());
        summary.put("networkLabel", election.getNetworkLabel());
        summary.put("totalVotes", totalVotesCount);
        summary.put("uniqueIps", allUniqueIps.size());
        summary.put("candidateCount", election.getCandidates().size());

        return Map.of(
                "summary", summary,
                "groupByIp", groupByIp,
                "groupByNetwork", groupByNetwork,
                "groupByCandidate", groupByCandidate
        );
    }

    // --- Member Directory (Global Candidates) ---

    public List<Candidate> getAllCandidates() {
        return mongoTemplate.findAll(Candidate.class);
    }

    public Candidate addCandidate(String name, String partyColor) {
        String randomId = "cand_" + UUID.randomUUID().toString().substring(0, 8);
        Candidate newCandidate = new Candidate(randomId, name, partyColor);
        return mongoTemplate.insert(newCandidate);
    }

    // Legacy status backward compatibility
    public boolean isElectionOpen() {
        ElectionSettings settings = mongoTemplate.findById("global_settings", ElectionSettings.class);
        return settings != null && settings.isOpen();
    }

    public void setElectionStatus(boolean isOpen) {
        Query query = new Query(Criteria.where("_id").is("global_settings"));
        Update update = new Update().set("isOpen", isOpen);
        mongoTemplate.upsert(query, update, ElectionSettings.class);

        // Also update default election if present
        Election defaultElec = mongoTemplate.findById("elec_default", Election.class);
        if (defaultElec != null) {
            defaultElec.setOpen(isOpen);
            mongoTemplate.save(defaultElec);
        }
    }
}