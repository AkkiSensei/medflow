package com.hospital.mapper;

import com.hospital.dto.PatientCreateRequest;
import com.hospital.dto.PatientResponse;
import com.hospital.model.Patient;

public final class PatientMapper {

    private PatientMapper() {
    }

    public static Patient toEntity(PatientCreateRequest request) {
        Patient patient = new Patient();
        patient.setFirstName(request.firstName());
        patient.setLastName(request.lastName());
        patient.setAge(request.age());
        patient.setGender(request.gender());
        patient.setWard(request.ward());
        patient.setReason(request.reason());
        return patient;
    }

    public static PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getFirstName(),
                patient.getLastName(),
                patient.getAge(),
                patient.getGender(),
                patient.getWard(),
                patient.getAdmissionDate(),
                patient.getStatus(),
                patient.getReason()
        );
    }
}
