package com.hospital.dto;

import java.util.Map;

public record DashboardMetricsResponse(
        long totalPatients,
        long admittedPatients,
        long dischargedPatients,
        double occupancyRate,
        Map<String, Long> wardDistribution,
        Map<String, Long> genderDistribution
) {
}
