package com.flowforge.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {
        // Utility class — no instantiation
    }

    /**
     * Extracts the UUID userId from the currently authenticated user.
     */
    public static UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new RuntimeException("No authenticated user found");
        }
        return userDetails.getUserId();
    }

    /**
     * Extracts the email from the currently authenticated user.
     */
    public static String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new RuntimeException("No authenticated user found");
        }
        return authentication.getName();
    }
}
