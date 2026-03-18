package com.flowforge.backend.controller;

import com.flowforge.backend.dto.*;
import com.flowforge.backend.dto.request.*;
import com.flowforge.backend.dto.response.*;
import com.flowforge.backend.security.SecurityUtils;
import com.flowforge.backend.service.*;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflows/{workflowId}/steps")
@RequiredArgsConstructor
@Tag(name = "Steps", description = "Step management endpoints")
@SecurityRequirement(name = "bearerAuth")
@SuppressWarnings("null")
public class StepController {

    private final StepService stepService;

    @PostMapping
    @Operation(summary = "Create a new step in a workflow")
    public ResponseEntity<ApiResponse<StepResponse>> createStep(
            @PathVariable UUID workflowId,
            @Valid @RequestBody CreateStepRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        request.setWorkflowId(workflowId);
        StepResponse response = stepService.createStep(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Step created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all steps for a workflow")
    public ResponseEntity<ApiResponse<List<StepResponse>>> getStepsByWorkflow(
            @PathVariable UUID workflowId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<StepResponse> steps = stepService.getStepsByWorkflow(workflowId, userId);
        return ResponseEntity.ok(ApiResponse.success("Steps retrieved successfully", steps));
    }

    @GetMapping("/{stepId}")
    @Operation(summary = "Get step details by ID")
    public ResponseEntity<ApiResponse<StepDetailResponse>> getStepById(
            @PathVariable UUID workflowId,
            @PathVariable UUID stepId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        StepDetailResponse step = stepService.getStepById(stepId, workflowId, userId);
        return ResponseEntity.ok(ApiResponse.success("Step retrieved successfully", step));
    }

    @PutMapping("/{stepId}")
    @Operation(summary = "Update a step")
    public ResponseEntity<ApiResponse<StepResponse>> updateStep(
            @PathVariable UUID workflowId,
            @PathVariable UUID stepId,
            @Valid @RequestBody UpdateStepRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        StepResponse response = stepService.updateStep(stepId, workflowId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Step updated successfully", response));
    }

    @DeleteMapping("/{stepId}")
    @Operation(summary = "Delete a step")
    public ResponseEntity<ApiResponse<Void>> deleteStep(
            @PathVariable UUID workflowId,
            @PathVariable UUID stepId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        stepService.deleteStep(stepId, workflowId, userId);
        return ResponseEntity.ok(ApiResponse.success("Step deleted successfully"));
    }

    @PutMapping("/reorder")
    @Operation(summary = "Reorder steps in a workflow")
    public ResponseEntity<ApiResponse<List<StepResponse>>> reorderSteps(
            @PathVariable UUID workflowId,
            @Valid @RequestBody ReorderStepsRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<StepResponse> steps = stepService.reorderSteps(workflowId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Steps reordered successfully", steps));
    }
}

