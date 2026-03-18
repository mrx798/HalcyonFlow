package com.flowforge.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class HealthReportResponse {
    private int score;
    private List<HealthCheck> checks;

    @Data
    @Builder
    public static class HealthCheck {
        private String name;
        private String status; // "PASS", "FAIL", "WARNING"
        private String message;
    }
}
