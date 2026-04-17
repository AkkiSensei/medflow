package com.hospital.dto;

import com.hospital.model.UserRole;

public record LoginResponse(
        String token,
        String username,
        String displayName,
        UserRole role,
        String message
) {
}
