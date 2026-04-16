package com.hospital.service;

import com.hospital.dto.PatientCreateRequest;
import com.hospital.dto.PatientResponse;
import com.hospital.dto.DashboardMetricsResponse;
import com.hospital.dto.PageResponse;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.mapper.PatientMapper;
import com.hospital.model.Patient;
import com.hospital.model.PatientStatus;
import com.hospital.model.Ward;
import com.hospital.repository.PatientRepository;
import com.hospital.repository.PatientSpecifications;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    @Autowired
    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll()
                .stream()
                .map(PatientMapper::toResponse)
                .toList();
    }

    public PatientResponse admitPatient(PatientCreateRequest request) {
        Patient newPatient = PatientMapper.toEntity(request);
        newPatient.setStatus(PatientStatus.ADMITTED);
        newPatient.setAdmissionDate(LocalDate.now());

        if (newPatient.getReason() == null || newPatient.getReason().trim().isEmpty()) {
            newPatient.setReason("Not specified");
        }

        Patient savedPatient = patientRepository.save(newPatient);
        return PatientMapper.toResponse(savedPatient);
    }

    public DashboardMetricsResponse getDashboardMetrics() {
        List<Patient> patients = patientRepository.findAll();

        long total = patients.size();
        long admitted = patients.stream()
                .filter(patient -> patient.getStatus() == PatientStatus.ADMITTED)
                .count();
        long discharged = patients.stream()
                .filter(patient -> patient.getStatus() == PatientStatus.DISCHARGED)
                .count();
        double occupancyRate = total == 0 ? 0.0 : (admitted * 100.0) / total;

        Map<String, Long> wardDistribution = patients.stream()
                .collect(Collectors.groupingBy(patient -> patient.getWard().name(), Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        Map<String, Long> genderDistribution = patients.stream()
                .collect(Collectors.groupingBy(patient -> patient.getGender().name(), Collectors.counting()));

        return new DashboardMetricsResponse(total, admitted, discharged, occupancyRate, wardDistribution, genderDistribution);
    }

    public PageResponse<PatientResponse> getPatientsPaged(int page, int size, PatientStatus status, Ward ward, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Specification<Patient> specification = Specification
                .where(PatientSpecifications.hasStatus(status))
                .and(PatientSpecifications.hasWard(ward))
                .and(PatientSpecifications.nameContains(search));

        Page<PatientResponse> patientPage = patientRepository.findAll(specification, pageable)
                .map(PatientMapper::toResponse);

        return new PageResponse<>(
                patientPage.getContent(),
                patientPage.getNumber(),
                patientPage.getSize(),
                patientPage.getTotalElements(),
                patientPage.getTotalPages(),
                patientPage.isFirst(),
                patientPage.isLast()
        );
    }

    public PatientResponse dischargePatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found for id " + id));

        patient.setStatus(PatientStatus.DISCHARGED);
        Patient updatedPatient = patientRepository.save(patient);
        return PatientMapper.toResponse(updatedPatient);
    }
}