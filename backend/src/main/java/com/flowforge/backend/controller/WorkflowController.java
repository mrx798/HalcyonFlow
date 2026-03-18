package com.flowforge.backend.controller;

import com.flowforge.backend.dto.request.WorkflowRequest;
import com.flowforge.backend.dto.response.ApiResponse;
import com.flowforge.backend.dto.response.WorkflowResponse;
import com.flowforge.backend.security.SecurityUtils;
import com.flowforge.backend.service.WorkflowService;
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
public class WorkflowController {

    private final WorkflowService workflowService;

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
}

