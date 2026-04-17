package com.hospital.repository;

import com.hospital.model.Appointment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctorNameIgnoreCaseOrderByAppointmentDateAscAppointmentTimeAsc(String doctorName);
}
