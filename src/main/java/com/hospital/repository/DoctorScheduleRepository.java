package com.hospital.repository;

import com.hospital.model.DoctorSchedule;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {
    List<DoctorSchedule> findByDoctorNameIgnoreCaseOrderByDayOfWeekAscShiftStartAsc(String doctorName);
}
