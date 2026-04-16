package com.hospital.dto;

import com.hospital.model.Gender;
import com.hospital.model.PatientStatus;
import com.hospital.model.Ward;
import java.time.LocalDate;

public record PatientResponse(
        Long id,
        String firstName,
        String lastName,
        int age,
        Gender gender,
        Ward ward,
        LocalDate admissionDate,
        PatientStatus status,
        String reason
) {
}
