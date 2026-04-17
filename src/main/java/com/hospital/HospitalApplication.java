package com.hospital;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class HospitalApplication {

    public static void main(String[] args) {
        SpringApplication.run(HospitalApplication.class, args);
    }

    @Bean
    ApplicationRunner printStartupLinks(Environment environment) {
        return args -> {
            String port = environment.getProperty("server.port", "8080");
            String contextPath = environment.getProperty("server.servlet.context-path", "");
            String baseUrl = "http://localhost:" + port + contextPath;

            System.out.println();
            System.out.println("MedFlow links:");
            System.out.println("App UI: " + baseUrl);
            System.out.println("H2 Console: " + baseUrl + "/h2-console");
            System.out.println();
        };
    }
}