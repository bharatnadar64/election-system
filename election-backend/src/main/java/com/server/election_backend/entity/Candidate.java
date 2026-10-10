package com.server.election_backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "candidates")
public class Candidate {
    @Id
    private String id;
    private String name;
    private long voteCount;
    private String partyColor;

    // Tracks votes segmented by IP group
    private Map<String, Integer> networkBreakdown = new HashMap<>();

    public Candidate(String id, String name, String partyColor) {
        this.id = id;
        this.name = name;
        this.partyColor = partyColor;
        this.voteCount = 0;
    }

    // ... getters and setters ...

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public long getVoteCount() {
        return voteCount;
    }

    public void setVoteCount(long voteCount) {
        this.voteCount = voteCount;
    }

    public String getPartyColor() {
        return partyColor;
    }

    public void setPartyColor(String partyColor) {
        this.partyColor = partyColor;
    }

    public Map<String, Integer> getNetworkBreakdown() {
        return networkBreakdown;
    }

    public void setNetworkBreakdown(Map<String, Integer> networkBreakdown) {
        this.networkBreakdown = networkBreakdown;
    }
}
