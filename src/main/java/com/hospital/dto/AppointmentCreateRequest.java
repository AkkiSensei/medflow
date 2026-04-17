package com.hospital.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentCreateRequest(
        @NotBlank(message = "Doctor name is required")
        String doctorName,
        @NotBlank(message = "Patient name is required")
        String patientName,
        @NotNull(message = "Appointment date is required")
        @FutureOrPresent(message = "Appointment date cannot be in the past")
        LocalDate appointmentDate,
        @NotNull(message = "Appointment time is required")
        LocalTime appointmentTime,
        @NotBlank(message = "Department is required")
        String department,
        String notes
) {
}
