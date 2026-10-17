package com.server.election_backend;

import com.server.election_backend.entity.Election;
import com.server.election_backend.service.VotingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class VotingServiceTest {

    private VotingService votingService;
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void setUp() {
        mongoTemplate = Mockito.mock(MongoTemplate.class);
        votingService = new VotingService(mongoTemplate);
    }

    @Test
    void testIpNormalization() {
        assertEquals("127.0.0.1", votingService.normalizeIp("127.0.0.1"));
        assertEquals("127.0.0.1", votingService.normalizeIp("0:0:0:0:0:0:0:1"));
        assertEquals("127.0.0.1", votingService.normalizeIp("::1"));
        assertEquals("192.168.1.50", votingService.normalizeIp("192.168.1.50, 10.0.0.1"));
        assertEquals("127.0.0.1", votingService.normalizeIp(null));
        assertEquals("127.0.0.1", votingService.normalizeIp("   "));
    }

    @Test
    void testIsIpAllowedAllTraffic() {
        Election publicElection = new Election("elec_1", "Public", "Desc", "ALL", List.of("*"), "Public");
        assertTrue(votingService.isIpAllowed("192.168.1.10", publicElection));
        assertTrue(votingService.isIpAllowed("10.0.0.1", publicElection));
        assertTrue(votingService.isIpAllowed("127.0.0.1", publicElection));
    }

    @Test
    void testIsIpAllowedRestrictedExactAndWildcard() {
        Election restrictedElection = new Election(
                "elec_2",
                "Restricted",
                "Desc",
                "RESTRICTED",
                List.of("127.0.0.1", "192.168.1.*", "10.0.0.50"),
                "Campus Dept"
        );

        // Exact match
        assertTrue(votingService.isIpAllowed("127.0.0.1", restrictedElection));
        assertTrue(votingService.isIpAllowed("::1", restrictedElection)); // IPv6 loopback resolves to 127.0.0.1
        assertTrue(votingService.isIpAllowed("10.0.0.50", restrictedElection));

        // Wildcard match
        assertTrue(votingService.isIpAllowed("192.168.1.99", restrictedElection));
        assertTrue(votingService.isIpAllowed("192.168.1.1", restrictedElection));

        // Not allowed
        assertFalse(votingService.isIpAllowed("192.168.2.1", restrictedElection));
        assertFalse(votingService.isIpAllowed("10.0.0.51", restrictedElection));
        assertFalse(votingService.isIpAllowed("8.8.8.8", restrictedElection));
    }

    @Test
    void testClassifyNetwork() {
        Election election = new Election("elec_1", "CS Dept Election", "", "RESTRICTED", List.of("192.168.1.*"), "CS Department LAN");

        assertEquals("CS Department LAN", votingService.classifyNetwork("192.168.1.45", election));
        assertEquals("Local Admin / Loopback", votingService.classifyNetwork("127.0.0.1", null));
        assertEquals("Campus Dorms (10.0.x)", votingService.classifyNetwork("10.0.1.20", null));
        assertEquals("External / Public (8.8.8.8)", votingService.classifyNetwork("8.8.8.8", null));
    }
}
