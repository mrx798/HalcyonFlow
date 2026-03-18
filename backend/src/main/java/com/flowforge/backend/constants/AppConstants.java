package com.flowforge.backend.constants;

/**
 * Application-wide constants to eliminate magic strings.
 */
public final class AppConstants {
    
    private AppConstants() {
        // Prevent instantiation
    }

    // Rule Conditions
    public static final String RULE_DEFAULT = "DEFAULT";

    // Execution Statuses (for logs and steps)
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_WAITING = "WAITING";
    public static final String STATUS_PAUSED = "PAUSED";
    public static final String STATUS_RUNNING = "RUNNING";

    // Action Types
    public static final String ACTION_APPROVED = "APPROVED";
    public static final String ACTION_REJECTED = "REJECTED";
    public static final String ACTION_RETRY = "RETRY";
}
