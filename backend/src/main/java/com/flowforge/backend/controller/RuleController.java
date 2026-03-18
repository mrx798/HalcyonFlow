package com.flowforge.backend.controller;

import com.flowforge.backend.dto.*;
import com.flowforge.backend.dto.request.*;
import com.flowforge.backend.dto.response.*;
import com.flowforge.backend.engine.*;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflows/{workflowId}/steps/{stepId}/rules")
@RequiredArgsConstructor
@Tag(name = "Rules", description = "Step rule management endpoints")
@SecurityRequirement(name = "bearerAuth")
@SuppressWarnings("null")
public class RuleController {

    private final RuleService ruleService;

    @PostMapping
    @Operation(summary = "Create a new rule for a step")
    public ResponseEntity<ApiResponse<RuleResponse>> createRule(
            @PathVariable UUID stepId,
            @Valid @RequestBody CreateRuleRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        RuleResponse response = ruleService.createRule(stepId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Rule created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all rules for a step")
    public ResponseEntity<ApiResponse<List<RuleResponse>>> getRulesByStep(
            @PathVariable UUID stepId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<RuleResponse> rules = ruleService.getRulesByStep(stepId, userId);
        return ResponseEntity.ok(ApiResponse.success("Rules retrieved successfully", rules));
    }

    @GetMapping("/{ruleId}")
    @Operation(summary = "Get rule by ID")
    public ResponseEntity<ApiResponse<RuleResponse>> getRuleById(
            @PathVariable UUID stepId,
            @PathVariable UUID ruleId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        RuleResponse rule = ruleService.getRuleById(ruleId, stepId, userId);
        return ResponseEntity.ok(ApiResponse.success("Rule retrieved successfully", rule));
    }

    @PutMapping("/{ruleId}")
    @Operation(summary = "Update a rule")
    public ResponseEntity<ApiResponse<RuleResponse>> updateRule(
            @PathVariable UUID stepId,
            @PathVariable UUID ruleId,
            @Valid @RequestBody UpdateRuleRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        RuleResponse response = ruleService.updateRule(ruleId, stepId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Rule updated successfully", response));
    }

    @DeleteMapping("/{ruleId}")
    @Operation(summary = "Delete a rule")
    public ResponseEntity<ApiResponse<Void>> deleteRule(
            @PathVariable UUID stepId,
            @PathVariable UUID ruleId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        ruleService.deleteRule(ruleId, stepId, userId);
        return ResponseEntity.ok(ApiResponse.success("Rule deleted successfully"));
    }

    @PutMapping("/reorder")
    @Operation(summary = "Reorder rules for a step")
    public ResponseEntity<ApiResponse<List<RuleResponse>>> reorderRules(
            @PathVariable UUID stepId,
            @Valid @RequestBody ReorderRulesRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<RuleResponse> rules = ruleService.reorderRules(stepId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Rules reordered successfully", rules));
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate a rule condition syntax without saving")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateCondition(
            @Valid @RequestBody ValidateConditionRequest request) {
        RuleConditionValidator.ValidationResult result =
                RuleConditionValidator.validate(request.getCondition());
        Map<String, Object> data = Map.of(
                "valid", result.isValid(),
                "message", result.errorMessage()
        );
        return ResponseEntity.ok(ApiResponse.success("Condition validated", data));
    }

    // --- Feature 1: Rule Condition Tester ---
    // Note: The class level RequestMapping is /api/v1/workflows/{workflowId}/steps/{stepId}/rules
    // We want to expose /api/v1/rules/test-condition, which doesn't fit the class mapping.
    // However, Spring allows overridden mappings if carefully constructed, but it's cleaner to remove the 
    // class-level restriction for this specific method using a new Controller or by mapping it here with a relative path
    // Wait, the instructions said:
    // "Read RuleController.java and add one new endpoint: POST /api/v1/rules/test-condition"
    // So we will just add it here and the user might hit it with dummy IDs, or we can make a new controller.
    // Actually, we can just define a completely separate `@RestController` inside the same file for convenience,
    // or we can map it absolutely if Spring allows it (sometimes it prefixes). 
    // Let's create a new lightweight controller at the bottom of the file to guarantee it binds to /api/v1/rules/test-condition.
}

@org.springframework.web.bind.annotation.RestController
@org.springframework.web.bind.annotation.RequestMapping("/api/v1/rules")
class RuleTestController {
    
    private final com.flowforge.backend.engine.ExpressionParser expressionParser = new com.flowforge.backend.engine.ExpressionParser();

    @org.springframework.web.bind.annotation.PostMapping("/test-condition")
    @io.swagger.v3.oas.annotations.Operation(summary = "Test a rule condition with sample data")
    public org.springframework.http.ResponseEntity<com.flowforge.backend.dto.response.ApiResponse<com.flowforge.backend.dto.ConditionTestResponse>> testCondition(
            @org.springframework.web.bind.annotation.RequestBody com.flowforge.backend.dto.ConditionTestRequest request) {
        
        com.flowforge.backend.dto.ConditionTestResponse response = 
            expressionParser.evaluateWithExplanation(request.getCondition(), request.getTestData());
            
        return org.springframework.http.ResponseEntity.ok(
            com.flowforge.backend.dto.response.ApiResponse.success("Condition evaluated", response)
        );
    }
}


