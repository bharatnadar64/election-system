package com.server.election_backend.entity;

import java.util.HashMap;
import java.util.Map;

public class ElectionCandidate {
    private String id;
    private String name;
    private String partyColor;
    private long voteCount = 0;
    // Tracks votes segmented by IP group / demographic
    private Map<String, Integer> networkBreakdown = new HashMap<>();

    public ElectionCandidate() {
    }

    public ElectionCandidate(String id, String name, String partyColor) {
        this.id = id;
        this.name = name;
        this.partyColor = partyColor;
        this.voteCount = 0;
        this.networkBreakdown = new HashMap<>();
    }

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

    public String getPartyColor() {
        return partyColor;
    }

    public void setPartyColor(String partyColor) {
        this.partyColor = partyColor;
    }

    public long getVoteCount() {
        return voteCount;
    }

    public void setVoteCount(long voteCount) {
        this.voteCount = voteCount;
    }

    public Map<String, Integer> getNetworkBreakdown() {
        return networkBreakdown;
    }

    public void setNetworkBreakdown(Map<String, Integer> networkBreakdown) {
        this.networkBreakdown = networkBreakdown;
    }
}
