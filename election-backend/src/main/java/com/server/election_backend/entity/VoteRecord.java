package com.server.election_backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "votes")
public class VoteRecord {
    @Id
    private String id;

    @Indexed(unique = true)
    private String ipAddress;

    private String candidateId;
    private Instant timestamp;

    public VoteRecord(String ipAddress, String candidateId) {
        this.ipAddress = ipAddress;
        this.candidateId = candidateId;
        this.timestamp = Instant.now();
    }

    // Getters and Setters...

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}