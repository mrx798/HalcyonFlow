package com.flowforge.backend.controller;

import com.flowforge.backend.dto.request.ApproveStepRequest;
import com.flowforge.backend.dto.request.ExecuteWorkflowRequest;
import com.flowforge.backend.dto.response.ApiResponse;
import com.flowforge.backend.dto.response.ExecutionResponse;
import com.flowforge.backend.dto.response.ExecutionSummaryResponse;
import com.flowforge.backend.security.SecurityUtils;
import com.flowforge.backend.service.ExecutionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/executions")
@RequiredArgsConstructor
@Tag(name = "Executions", description = "Workflow execution endpoints")
@SecurityRequirement(name = "bearerAuth")
@SuppressWarnings("null")
public class ExecutionController {

    private final ExecutionService executionService;

    @PostMapping
    @Operation(summary = "Start a workflow execution")
    public ResponseEntity<ApiResponse<ExecutionResponse>> startExecution(
            @Valid @RequestBody ExecuteWorkflowRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        ExecutionResponse response = executionService.startExecution(request, userId);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Execution started successfully", response));
    }

    @GetMapping("/{executionId}")
    @Operation(summary = "Get execution details")
    public ResponseEntity<ApiResponse<ExecutionResponse>> getExecution(
            @PathVariable UUID executionId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        ExecutionResponse response = executionService.getExecution(executionId, userId);
        return ResponseEntity.ok(ApiResponse.success("Execution retrieved successfully", response));
    }

    @PostMapping("/{executionId}/resume")
    @Operation(summary = "Resume a paused execution (approve or reject current step)")
    public ResponseEntity<ApiResponse<ExecutionResponse>> resumeExecution(
            @PathVariable UUID executionId,
            @Valid @RequestBody ApproveStepRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        ExecutionResponse response = executionService.resumeExecution(executionId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Execution resumed successfully", response));
    }

    @PostMapping("/{executionId}/approve/{stepId}")
    @Operation(summary = "Approve or reject a specific step")
    public ResponseEntity<ApiResponse<ExecutionResponse>> approveStep(
            @PathVariable UUID executionId,
            @PathVariable UUID stepId,
            @Valid @RequestBody ApproveStepRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        ExecutionResponse response = executionService.approveStep(executionId, stepId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Step approval processed", response));
    }

    @PostMapping("/{executionId}/cancel")
    @Operation(summary = "Cancel a running execution")
    public ResponseEntity<ApiResponse<ExecutionResponse>> cancelExecution(
            @PathVariable UUID executionId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        ExecutionResponse response = executionService.cancelExecution(executionId, userId);
        return ResponseEntity.ok(ApiResponse.success("Execution cancelled successfully", response));
    }

    @PostMapping("/{executionId}/retry")
    @Operation(summary = "Retry a failed execution")
    public ResponseEntity<ApiResponse<ExecutionResponse>> retryExecution(
            @PathVariable UUID executionId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        ExecutionResponse response = executionService.retryExecution(executionId, userId);
        return ResponseEntity.ok(ApiResponse.success("Execution retry started", response));
    }

    @GetMapping("/workflow/{workflowId}")
    @Operation(summary = "Get executions for a workflow")
    public ResponseEntity<ApiResponse<List<ExecutionSummaryResponse>>> getExecutionsByWorkflow(
            @PathVariable UUID workflowId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<ExecutionSummaryResponse> executions = executionService.getExecutionsByWorkflow(workflowId, userId);
        return ResponseEntity.ok(ApiResponse.success("Executions retrieved successfully", executions));
    }

    @GetMapping
    @Operation(summary = "Get all executions (paginated)")
    public ResponseEntity<ApiResponse<Page<ExecutionSummaryResponse>>> getAllExecutions(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = SecurityUtils.getCurrentUserId();
        Page<ExecutionSummaryResponse> executions = executionService.getAllExecutions(pageable, userId);
        return ResponseEntity.ok(ApiResponse.success("Executions retrieved successfully", executions));
    }
}

