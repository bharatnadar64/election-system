package com.server.election_backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "votes")
@CompoundIndexes({
    @CompoundIndex(name = "election_ip_idx", def = "{'electionId': 1, 'ipAddress': 1}", unique = false)
})
public class VoteRecord {
    @Id
    private String id;

    @Indexed
    private String electionId;

    @Indexed
    private String ipAddress;

    private String candidateId;
    private Instant timestamp;
    private String networkGroup;

    public VoteRecord() {
        this.timestamp = Instant.now();
    }

    public VoteRecord(String ipAddress, String candidateId) {
        this.ipAddress = ipAddress;
        this.candidateId = candidateId;
        this.timestamp = Instant.now();
        this.networkGroup = "Standard";
    }

    public VoteRecord(String electionId, String ipAddress, String candidateId, String networkGroup) {
        this.electionId = electionId;
        this.ipAddress = ipAddress;
        this.candidateId = candidateId;
        this.timestamp = Instant.now();
        this.networkGroup = networkGroup;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getElectionId() {
        return electionId;
    }

    public void setElectionId(String electionId) {
        this.electionId = electionId;
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

    public String getNetworkGroup() {
        return networkGroup;
    }

    public void setNetworkGroup(String networkGroup) {
        this.networkGroup = networkGroup;
    }
}