package com.hospital.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record DoctorScheduleResponse(
        Long id,
        String doctorName,
        DayOfWeek dayOfWeek,
        LocalTime shiftStart,
        LocalTime shiftEnd,
        String department,
        String roomNumber
) {
}
