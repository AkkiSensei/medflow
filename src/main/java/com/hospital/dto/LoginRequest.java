package com.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 3, max = 80, message = "Name must be between 3 and 80 characters")
        String name,
        @NotBlank(message = "ID is required")
        @Size(min = 4, max = 40, message = "ID must be between 4 and 40 characters")
        String employeeId,
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 60, message = "Password must be between 8 and 60 characters")
        String password
) {
}
