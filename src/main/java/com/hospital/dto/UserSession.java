package com.hospital.dto;

import com.hospital.model.UserRole;

public record UserSession(
        String token,
        String username,
        String displayName,
        UserRole role
) {
}
