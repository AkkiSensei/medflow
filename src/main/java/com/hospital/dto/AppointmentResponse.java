package com.hospital.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentResponse(
        Long id,
        String doctorName,
        String patientName,
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        String department,
        String notes
) {
}
