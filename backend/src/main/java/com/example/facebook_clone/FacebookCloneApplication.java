package com.example.facebook_clone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import javax.annotation.PostConstruct;
import java.io.File;

@SpringBootApplication
public class FacebookCloneApplication {

	@PostConstruct
	public void init() {
		// Create uploads directory if it doesn't exist
		File uploadsDir = new File("uploads");
		if (!uploadsDir.exists()) {
			uploadsDir.mkdirs();
		}
	}

	public static void main(String[] args) {
		SpringApplication.run(FacebookCloneApplication.class, args);
	}

}
