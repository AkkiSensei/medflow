package com.hospital.dto;

import com.hospital.model.Gender;
import com.hospital.model.Ward;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PatientCreateRequest(
        @NotBlank(message = "First name is mandatory")
        String firstName,
        @NotBlank(message = "Last name is mandatory")
        String lastName,
        @Min(value = 0, message = "Age cannot be negative")
        int age,
        @NotNull(message = "Gender is mandatory")
        Gender gender,
        @NotNull(message = "Ward is mandatory")
        Ward ward,
        @Size(max = 500, message = "Reason cannot exceed 500 characters")
        String reason
) {
}
