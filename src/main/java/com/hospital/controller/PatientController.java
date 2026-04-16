package com.hospital.controller;

import com.hospital.dto.PatientCreateRequest;
import com.hospital.dto.PatientResponse;
import com.hospital.dto.DashboardMetricsResponse;
import com.hospital.dto.PageResponse;
import com.hospital.model.PatientStatus;
import com.hospital.model.Ward;
import com.hospital.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientService patientService;

    @Autowired
    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public List<PatientResponse> getAllPatients() {
        return patientService.getAllPatients();
    }

    @GetMapping("/search")
    public PageResponse<PatientResponse> searchPatients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) PatientStatus status,
            @RequestParam(required = false) Ward ward,
            @RequestParam(required = false) String search
    ) {
        return patientService.getPatientsPaged(page, size, status, ward, search);
    }

    @PostMapping
    public PatientResponse admitPatient(@Valid @RequestBody PatientCreateRequest newPatient) {
        return patientService.admitPatient(newPatient);
    }

    @PatchMapping("/{id}/discharge")
    public PatientResponse dischargePatient(@PathVariable Long id) {
        return patientService.dischargePatient(id);
    }

    @GetMapping("/metrics")
    public DashboardMetricsResponse getDashboardMetrics() {
        return patientService.getDashboardMetrics();
    }
}