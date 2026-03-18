package com.flowforge.backend.controller;
import com.flowforge.backend.dto.*;
import com.flowforge.backend.dto.request.*;
import com.flowforge.backend.dto.response.*;
import com.flowforge.backend.exception.*;
import com.flowforge.backend.security.SecurityUtils;
import com.flowforge.backend.service.*;
import com.flowforge.backend.repository.UserRepository;
import com.flowforge.backend.entity.User;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflows")
@RequiredArgsConstructor
@Tag(name = "Workflows", description = "Workflow management endpoints")
@SecurityRequirement(name = "bearerAuth")
@SuppressWarnings("null")
@Slf4j
public class WorkflowController {

    private final WorkflowService workflowService;
    private final SimulationService simulationService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Create a new workflow")
    public ResponseEntity<ApiResponse<WorkflowResponse>> createWorkflow(
            @Valid @RequestBody WorkflowRequest request) {
        String userEmail = SecurityUtils.getCurrentUserEmail();
        WorkflowResponse response = workflowService.createWorkflow(request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Workflow created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all workflows for the current user")
    public ResponseEntity<ApiResponse<Page<WorkflowResponse>>> getWorkflows(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        String userEmail = SecurityUtils.getCurrentUserEmail();
        Page<WorkflowResponse> workflows = workflowService.getWorkflows(userEmail, page, size, search);
        return ResponseEntity.ok(ApiResponse.success("Workflows retrieved successfully", workflows));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get workflow by ID")
    public ResponseEntity<ApiResponse<WorkflowResponse>> getWorkflowById(@PathVariable UUID id) {
        String userEmail = SecurityUtils.getCurrentUserEmail();
        WorkflowResponse workflow = workflowService.getWorkflowById(id, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Workflow retrieved successfully", workflow));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update workflow")
    public ResponseEntity<ApiResponse<WorkflowResponse>> updateWorkflow(
            @PathVariable UUID id,
            @Valid @RequestBody WorkflowRequest request) {
        String userEmail = SecurityUtils.getCurrentUserEmail();
        WorkflowResponse response = workflowService.updateWorkflow(id, request, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Workflow updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete workflow")
    public ResponseEntity<ApiResponse<Void>> deleteWorkflow(@PathVariable UUID id) {
        String userEmail = SecurityUtils.getCurrentUserEmail();
        workflowService.deleteWorkflow(id, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Workflow deleted successfully"));
    }

    @PostMapping("/{id}/validate")
    @Operation(summary = "Validate workflow is ready to execute")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateWorkflow(@PathVariable UUID id) {
        String userEmail = SecurityUtils.getCurrentUserEmail();
        Map<String, Object> result = workflowService.validateWorkflow(id, userEmail);
        boolean valid = (boolean) result.get("valid");
        String message = valid ? "Workflow is valid and ready to execute" : "Workflow has validation errors";
        return ResponseEntity.ok(ApiResponse.success(message, result));
    }

    @PostMapping("/{id}/simulate")
    @Operation(summary = "Dry run / simulate a workflow execution")
    public ResponseEntity<ApiResponse<SimulationResponse>> simulateWorkflow(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> inputData) {
        String userEmail = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
        SimulationResponse response = simulationService.simulateWorkflow(id, inputData, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Simulation completed", response));
    }

    @GetMapping("/{id}/health")
    @Operation(summary = "Get workflow health report")
    public ResponseEntity<ApiResponse<HealthReportResponse>> getWorkflowHealth(@PathVariable UUID id) {
        String userEmail = SecurityUtils.getCurrentUserEmail();
        HealthReportResponse report = workflowService.getWorkflowHealth(id, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Workflow health retrieved successfully", report));
    }
}

