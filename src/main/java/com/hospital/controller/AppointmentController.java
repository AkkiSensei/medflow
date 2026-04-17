package com.hospital.controller;

import com.hospital.dto.AppointmentResponse;
import com.hospital.dto.AppointmentCreateRequest;
import com.hospital.dto.DoctorScheduleResponse;
import com.hospital.dto.UserSession;
import com.hospital.model.UserRole;
import com.hospital.service.AppointmentService;
import com.hospital.service.AuthService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AuthService authService;

    public AppointmentController(AppointmentService appointmentService, AuthService authService) {
        this.appointmentService = appointmentService;
        this.authService = authService;
    }

    @GetMapping
    public List<AppointmentResponse> getAllAppointments(@RequestHeader("Authorization") String authHeader) {
        authService.authenticate(authHeader);
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/schedule")
    public List<AppointmentResponse> getSchedule(@RequestHeader("Authorization") String authHeader) {
        UserSession session = authService.authenticate(authHeader);
        if (session.role() == UserRole.DOCTOR) {
            return appointmentService.getDoctorSchedule(session.displayName());
        }
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/doctor-schedule")
    public List<DoctorScheduleResponse> getDoctorShiftSchedule(@RequestHeader("Authorization") String authHeader) {
        UserSession session = authService.authenticate(authHeader);
        if (session.role() == UserRole.DOCTOR) {
            return appointmentService.getDoctorShifts(session.displayName());
        }
        return appointmentService.getAllDoctorShifts();
    }

    @PostMapping
    public AppointmentResponse createAppointment(
            @Valid @RequestBody AppointmentCreateRequest request,
            @RequestHeader("Authorization") String authHeader
    ) {
        UserSession session = authService.authenticate(authHeader);
        authService.requireStaff(session);
        return appointmentService.createAppointment(request);
    }
}
