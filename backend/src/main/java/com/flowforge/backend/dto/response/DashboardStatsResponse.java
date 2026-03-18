package com.flowforge.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {

    private long totalWorkflows;
    private long activeWorkflows;
    private long totalExecutions;
    private long executionsToday;
    private double successRate;
    private long pendingApprovals;
    private List<ExecutionSummaryResponse> recentExecutions;
}

