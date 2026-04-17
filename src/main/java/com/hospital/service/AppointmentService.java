package com.hospital.service;

import com.hospital.dto.AppointmentResponse;
import com.hospital.dto.AppointmentCreateRequest;
import com.hospital.dto.DoctorScheduleResponse;
import com.hospital.model.Appointment;
import com.hospital.model.DoctorSchedule;
import com.hospital.repository.AppointmentRepository;
import com.hospital.repository.DoctorScheduleRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;

    public AppointmentService(AppointmentRepository appointmentRepository, DoctorScheduleRepository doctorScheduleRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorScheduleRepository = doctorScheduleRepository;
    }

    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .sorted(Comparator
                        .comparing(Appointment::getAppointmentDate)
                        .thenComparing(Appointment::getAppointmentTime))
                .map(this::toResponse)
                .toList();
    }

    public List<AppointmentResponse> getDoctorSchedule(String doctorName) {
        return appointmentRepository.findByDoctorNameIgnoreCaseOrderByAppointmentDateAscAppointmentTimeAsc(doctorName)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public AppointmentResponse createAppointment(AppointmentCreateRequest request) {
        Appointment appointment = new Appointment();
        appointment.setDoctorName(request.doctorName().trim());
        appointment.setPatientName(request.patientName().trim());
        appointment.setAppointmentDate(request.appointmentDate());
        appointment.setAppointmentTime(request.appointmentTime());
        appointment.setDepartment(request.department().trim());
        appointment.setNotes(request.notes() == null ? null : request.notes().trim());
        Appointment savedAppointment = appointmentRepository.save(appointment);
        return toResponse(savedAppointment);
    }

    public List<DoctorScheduleResponse> getDoctorShifts(String doctorName) {
        return doctorScheduleRepository.findByDoctorNameIgnoreCaseOrderByDayOfWeekAscShiftStartAsc(doctorName)
                .stream()
                .map(this::toScheduleResponse)
                .toList();
    }

    public List<DoctorScheduleResponse> getAllDoctorShifts() {
        return doctorScheduleRepository.findAll()
                .stream()
                .sorted(Comparator
                        .comparing(DoctorSchedule::getDoctorName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(DoctorSchedule::getDayOfWeek)
                        .thenComparing(DoctorSchedule::getShiftStart))
                .map(this::toScheduleResponse)
                .toList();
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getDoctorName(),
                appointment.getPatientName(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getDepartment(),
                appointment.getNotes()
        );
    }

    private DoctorScheduleResponse toScheduleResponse(DoctorSchedule schedule) {
        return new DoctorScheduleResponse(
                schedule.getId(),
                schedule.getDoctorName(),
                schedule.getDayOfWeek(),
                schedule.getShiftStart(),
                schedule.getShiftEnd(),
                schedule.getDepartment(),
                schedule.getRoomNumber()
        );
    }
}
