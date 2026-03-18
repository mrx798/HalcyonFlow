package com.flowforge.backend.controller;

import com.flowforge.backend.dto.response.ApiResponse;
import com.flowforge.backend.dto.response.DashboardStatsResponse;
import com.flowforge.backend.security.SecurityUtils;
import com.flowforge.backend.service.ExecutionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard statistics endpoints")
@SecurityRequirement(name = "bearerAuth")
@SuppressWarnings("null")
public class DashboardController {

    private final ExecutionService executionService;

    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        UUID userId = SecurityUtils.getCurrentUserId();
        DashboardStatsResponse stats = executionService.getDashboardStats(userId);
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved successfully", stats));
    }

    @GetMapping("/recent-executions")
    @Operation(summary = "Get recent executions for dashboard")
    public ResponseEntity<ApiResponse<java.util.List<com.flowforge.backend.dto.response.ExecutionSummaryResponse>>> getRecentExecutions() {
        UUID userId = SecurityUtils.getCurrentUserId();
        java.util.List<com.flowforge.backend.dto.response.ExecutionSummaryResponse> recent = 
            executionService.getRecentExecutions(userId);
        return ResponseEntity.ok(ApiResponse.success("Recent executions retrieved successfully", recent));
    }

    @GetMapping("/trends")
    @Operation(summary = "Get execution trends for dashboard")
    public ResponseEntity<ApiResponse<java.util.List<com.flowforge.backend.dto.response.ExecutionTrendResponse>>> getExecutionTrends() {
        UUID userId = SecurityUtils.getCurrentUserId();
        java.util.List<com.flowforge.backend.dto.response.ExecutionTrendResponse> trends = 
            executionService.getExecutionTrends(userId);
        return ResponseEntity.ok(ApiResponse.success("Execution trends retrieved successfully", trends));
    }
}

