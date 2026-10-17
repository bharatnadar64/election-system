package com.server.election_backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "elections")
public class Election {

    @Id
    private String id;
    private String title;
    private String description;
    private boolean isOpen = true;

    // "ALL" = Public to all networks; "RESTRICTED" = Only allowed IPs/subnets
    private String networkType = "ALL";

    // List of allowed exact IPs (e.g. 127.0.0.1) or prefixes (e.g. 192.168.1.*)
    private List<String> allowedIps = new ArrayList<>();

    // Friendly network label (e.g. "Computer Science Department", "Campus Dorms")
    private String networkLabel;

    private List<ElectionCandidate> candidates = new ArrayList<>();
    private String createdAt = Instant.now().toString();
    private String updatedAt = Instant.now().toString();

    public Election() {
    }

    public Election(String id, String title, String description, String networkType, List<String> allowedIps, String networkLabel) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.networkType = (networkType != null && !networkType.trim().isEmpty()) ? networkType : "ALL";
        this.allowedIps = allowedIps != null ? allowedIps : new ArrayList<>();
        this.networkLabel = networkLabel;
        this.isOpen = true;
        this.candidates = new ArrayList<>();
        this.createdAt = Instant.now().toString();
        this.updatedAt = Instant.now().toString();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isOpen() {
        return isOpen;
    }

    public void setOpen(boolean open) {
        isOpen = open;
    }

    public String getNetworkType() {
        return networkType;
    }

    public void setNetworkType(String networkType) {
        this.networkType = networkType;
    }

    public List<String> getAllowedIps() {
        return allowedIps;
    }

    public void setAllowedIps(List<String> allowedIps) {
        this.allowedIps = allowedIps;
    }

    public String getNetworkLabel() {
        return networkLabel;
    }

    public void setNetworkLabel(String networkLabel) {
        this.networkLabel = networkLabel;
    }

    public List<ElectionCandidate> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<ElectionCandidate> candidates) {
        this.candidates = candidates;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
