package com.hospital.controller;

import com.hospital.dto.PatientCreateRequest;
import com.hospital.dto.PatientResponse;
import com.hospital.dto.DashboardMetricsResponse;
import com.hospital.dto.PageResponse;
import com.hospital.dto.UserSession;
import com.hospital.model.PatientStatus;
import com.hospital.model.Ward;
import com.hospital.service.AuthService;
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
    private final AuthService authService;

    @Autowired
    public PatientController(PatientService patientService, AuthService authService) {
        this.patientService = patientService;
        this.authService = authService;
    }

    @GetMapping
    public List<PatientResponse> getAllPatients(@RequestHeader("Authorization") String authHeader) {
        authService.authenticate(authHeader);
        return patientService.getAllPatients();
    }

    @GetMapping("/search")
    public PageResponse<PatientResponse> searchPatients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) PatientStatus status,
            @RequestParam(required = false) Ward ward,
            @RequestParam(required = false) String search,
            @RequestHeader("Authorization") String authHeader
    ) {
        authService.authenticate(authHeader);
        return patientService.getPatientsPaged(page, size, status, ward, search);
    }

    @PostMapping
    public PatientResponse admitPatient(
            @Valid @RequestBody PatientCreateRequest newPatient,
            @RequestHeader("Authorization") String authHeader
    ) {
        UserSession session = authService.authenticate(authHeader);
        authService.requireStaff(session);
        return patientService.admitPatient(newPatient);
    }

    @PatchMapping("/{id}/discharge")
    public PatientResponse dischargePatient(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        UserSession session = authService.authenticate(authHeader);
        authService.requireStaff(session);
        return patientService.dischargePatient(id);
    }

    @GetMapping("/metrics")
    public DashboardMetricsResponse getDashboardMetrics(@RequestHeader("Authorization") String authHeader) {
        authService.authenticate(authHeader);
        return patientService.getDashboardMetrics();
    }
}