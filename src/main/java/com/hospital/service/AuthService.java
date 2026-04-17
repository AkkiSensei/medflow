package com.hospital.service;

import com.hospital.dto.LoginRequest;
import com.hospital.dto.LoginResponse;
import com.hospital.dto.UserSession;
import com.hospital.exception.ForbiddenException;
import com.hospital.exception.UnauthorizedException;
import com.hospital.model.UserRole;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final int MAX_INVALID_ATTEMPTS = 3;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(5);

    private final Map<String, InternalUser> users = Map.of(
            "DOC-1001", new InternalUser("DOC-1001", "DocPass@123", "Ritunjay Deo", UserRole.DOCTOR),
            "STF-2001", new InternalUser("STF-2001", "StaffPass@123", "Saanvi Chandel", UserRole.STAFF)
    );
    private final Map<String, UserSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, Integer> invalidAttempts = new ConcurrentHashMap<>();
    private final Map<String, Instant> lockedUntil = new ConcurrentHashMap<>();

    public LoginResponse login(LoginRequest request) {
        String normalizedEmployeeId = request.employeeId().trim().toUpperCase();
        String normalizedName = request.name().trim().toLowerCase();
        Instant lockExpiry = lockedUntil.get(normalizedEmployeeId);
        if (lockExpiry != null && lockExpiry.isAfter(Instant.now())) {
            long retryAfterSeconds = Duration.between(Instant.now(), lockExpiry).getSeconds();
            throw new UnauthorizedException("Too many invalid attempts. Try again in " + Math.max(retryAfterSeconds, 1) + " seconds.");
        }

        InternalUser user = users.get(normalizedEmployeeId);
        boolean validCredentials = user != null
                && user.displayName.toLowerCase().equals(normalizedName)
                && user.password.equals(request.password());

        if (!validCredentials) {
            int attempts = invalidAttempts.merge(normalizedEmployeeId, 1, Integer::sum);
            if (attempts >= MAX_INVALID_ATTEMPTS) {
                lockedUntil.put(normalizedEmployeeId, Instant.now().plus(LOCK_DURATION));
                invalidAttempts.remove(normalizedEmployeeId);
                throw new UnauthorizedException("Invalid login attempt flagged. Account locked for 5 minutes.");
            }
            int remaining = MAX_INVALID_ATTEMPTS - attempts;
            throw new UnauthorizedException("Invalid login attempt flagged. " + remaining + " attempt(s) left.");
        }

        invalidAttempts.remove(normalizedEmployeeId);
        lockedUntil.remove(normalizedEmployeeId);
        String token = UUID.randomUUID().toString();
        UserSession session = new UserSession(token, user.employeeId, user.displayName, user.role);
        sessions.put(token, session);
        return new LoginResponse(token, user.employeeId, user.displayName, user.role, "Login successful.");
    }

    public UserSession authenticate(String authHeader) {
        if (authHeader == null || authHeader.isBlank() || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing or invalid authorization header.");
        }
        String token = authHeader.substring("Bearer ".length()).trim();
        UserSession session = sessions.get(token);
        if (session == null) {
            throw new UnauthorizedException("Session expired or invalid token.");
        }
        return session;
    }

    public void requireStaff(UserSession session) {
        if (session.role() != UserRole.STAFF) {
            throw new ForbiddenException("Staff role is required for this action.");
        }
    }

    private static class InternalUser {
        private final String employeeId;
        private final String password;
        private final String displayName;
        private final UserRole role;

        private InternalUser(String employeeId, String password, String displayName, UserRole role) {
            this.employeeId = employeeId;
            this.password = password;
            this.displayName = displayName;
            this.role = role;
        }
    }
}
