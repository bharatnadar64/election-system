package com.server.election_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ElectionBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ElectionBackendApplication.class, args);
	}

}
