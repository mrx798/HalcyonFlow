package com.flowforge.backend.service;

import com.flowforge.backend.dto.request.ApproveStepRequest;
import com.flowforge.backend.dto.request.ExecuteWorkflowRequest;
import com.flowforge.backend.dto.response.DashboardStatsResponse;
import com.flowforge.backend.dto.response.ExecutionResponse;
import com.flowforge.backend.dto.response.ExecutionSummaryResponse;
import com.flowforge.backend.engine.ExpressionParser;
import com.flowforge.backend.engine.RuleEngine;
import com.flowforge.backend.engine.StepExecutor;
import com.flowforge.backend.entity.Execution;
import com.flowforge.backend.entity.Rule;
import com.flowforge.backend.entity.Step;
import com.flowforge.backend.entity.User;
import com.flowforge.backend.entity.Workflow;
import com.flowforge.backend.enums.ExecutionStatus;
import com.flowforge.backend.enums.NotificationType;
import com.flowforge.backend.enums.WorkflowStatus;
import com.flowforge.backend.exception.ResourceNotFoundException;
import com.flowforge.backend.repository.ExecutionRepository;
import com.flowforge.backend.repository.StepRepository;
import com.flowforge.backend.repository.UserRepository;
import com.flowforge.backend.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ExecutionService {
    private static final Logger log = LoggerFactory.getLogger(ExecutionService.class);

    private final ExecutionRepository executionRepository;
    private final WorkflowRepository workflowRepository;
    private final StepRepository stepRepository;
    private final UserRepository userRepository;
    private final RuleEngine ruleEngine;
    private final StepExecutor stepExecutor;
    private final NotificationService notificationService;
    private final ExpressionParser expressionParser = new ExpressionParser();

    @Transactional
    public ExecutionResponse startExecution(ExecuteWorkflowRequest request, @NonNull UUID userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId.toString()));

            Workflow workflow = workflowRepository.findById(request.getWorkflowId())
                    .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", request.getWorkflowId().toString()));

            // Allow both DRAFT and ACTIVE workflows to be executed (test runs use DRAFT)
            if (workflow.getStatus() != WorkflowStatus.ACTIVE && workflow.getStatus() != WorkflowStatus.DRAFT) {
                throw new RuntimeException("Workflow must be ACTIVE or DRAFT to execute. Current status: " + workflow.getStatus());
            }

            // Validate workflow has steps
            List<Step> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflow.getId());
            if (steps == null || steps.isEmpty()) {
                throw new RuntimeException("Workflow has no steps configured. Add steps before executing.");
            }

            // Auto-set startStepId if not set
            if (workflow.getStartStepId() == null) {
                workflow.setStartStepId(steps.get(0).getId());
                workflowRepository.save(workflow);
            }

            // Handle null input data gracefully
            if (request.getInputData() == null) {
                request.setInputData(new java.util.HashMap<>());
            }

            // Validate inputData against workflow inputSchema
            validateInputData(request.getInputData(), workflow.getInputSchema());

            // Create execution
            Execution execution = Execution.builder()
                    .workflow(workflow)
                    .workflowVersion(workflow.getVersion())
                    .status(ExecutionStatus.PENDING)
                    .inputData(request.getInputData())
                    .logs(new ArrayList<>())
                    .retries(0)
                    .triggeredBy(user)
                    .build();

            execution = executionRepository.save(execution);

            // Notify that execution started
            notificationService.createNotification(
                    userId, execution.getId(),
                    NotificationType.EXECUTION_STARTED,
                    "Execution Started",
                    "Workflow '" + workflow.getName() + "' execution has been started."
            );

            // Trigger async execution
            runExecutionAsync(execution.getId());

            return toExecutionResponse(execution);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to start execution: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to start execution: " + e.getMessage());
        }
    }

    @Async
    public void runExecutionAsync(@NonNull UUID executionId) {
        try {
            runExecution(executionId);
        } catch (Exception e) {
            log.error("Async execution failed for {}: {}", executionId, e.getMessage(), e);
        }
    }

    @Transactional
    public void runExecution(@NonNull UUID executionId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution", "id", executionId.toString()));

        execution.setStatus(ExecutionStatus.RUNNING);
        execution.setStartedAt(LocalDateTime.now());
        execution = executionRepository.save(execution);

        Workflow workflow = execution.getWorkflow();
        UUID currentStepId = execution.getCurrentStepId();

        // If no current step, start from the beginning
        if (currentStepId == null) {
            currentStepId = workflow.getStartStepId();
        }

        if (currentStepId == null) {
            failExecution(execution, "No start step defined for workflow");
            return;
        }

        int maxIterations = workflow.getMaxIterations() != null ? workflow.getMaxIterations() : 50;
        int totalIterations = 0;

        // Restore step visit counts from previous iterations/retries
        Map<UUID, Integer> stepVisits = new java.util.HashMap<>();
        if (execution.getLogs() != null) {
            for (Map<String, Object> logEntry : execution.getLogs()) {
                if (logEntry.containsKey("stepId") && "completed".equalsIgnoreCase(String.valueOf(logEntry.get("status")))) {
                    try {
                        UUID sid = UUID.fromString(logEntry.get("stepId").toString());
                        stepVisits.put(sid, stepVisits.getOrDefault(sid, 0) + 1);
                    } catch (Exception ignored) {}
                }
            }
        }

        while (currentStepId != null) {
            totalIterations++;
            if (totalIterations > 1000) {
                 failExecution(execution, "Global failsafe iteration limit reached. Possible infinite loop.");
                 return;
            }

            Step currentStep = stepRepository.findById(currentStepId).orElse(null);
            if (currentStep == null) {
                failExecution(execution, "Step not found: " + currentStepId);
                return;
            }

            int currentVisits = stepVisits.getOrDefault(currentStepId, 0);
            if (currentVisits >= maxIterations) {
                failExecution(execution, "Maximum iteration limit (" + maxIterations + ") reached for step '" + currentStep.getName() + "'. Possible infinite loop.");
                return;
            }
            stepVisits.put(currentStepId, currentVisits + 1);

            execution.setCurrentStepId(currentStepId);
            execution = executionRepository.save(execution);

            LocalDateTime stepStartTime = LocalDateTime.now();

            // Execute the step
            StepExecutor.StepExecutionResult stepResult =
                    stepExecutor.execute(currentStep, execution, execution.getInputData());

            // Build log entry
            Map<String, Object> logEntry = new LinkedHashMap<>();
            logEntry.put("stepId", currentStep.getId().toString());
            logEntry.put("step_name", currentStep.getName());
            logEntry.put("step_type", currentStep.getStepType().toString().toLowerCase());
            logEntry.put("status", stepResult.status().toLowerCase());
            logEntry.put("started_at", stepStartTime.toString());
            logEntry.put("ended_at", LocalDateTime.now().toString());

            if (stepResult.requiresApproval()) {
                logEntry.put("assigneeEmail", stepResult.assigneeEmail());
                execution.getLogs().add(logEntry);
                execution.setStatus(ExecutionStatus.PAUSED);
                execution = executionRepository.save(execution);
                log.info("Execution {} paused at step '{}' for approval", executionId, currentStep.getName());
                return; // Pause execution â€” will resume after approval
            }

            if ("FAILED".equals(stepResult.status())) {
                logEntry.put("errorMessage", stepResult.message());
                execution.getLogs().add(logEntry);
                failExecution(execution, stepResult.message());
                return;
            }

            // Step completed â€” evaluate rules to determine next step
            List<Rule> rules = currentStep.getRules();
            RuleEngine.RuleEvaluationResult ruleResult = ruleEngine.evaluate(rules, execution.getInputData());

            // Record each rule evaluation
            List<Map<String, Object>> evaluatedRules = new ArrayList<>();
            List<Rule> sortedRules = rules.stream()
                    .sorted(Comparator.comparingInt(Rule::getPriority))
                    .collect(Collectors.toList());

            boolean selectedByDefault = ruleResult.matched() && "DEFAULT".equals(ruleResult.matchedRule().getCondition());

            for (Rule rule : sortedRules) {
                Map<String, Object> ruleLog = new LinkedHashMap<>();
                ruleLog.put("rule", rule.getCondition());

                if ("DEFAULT".equals(rule.getCondition())) {
                    ruleLog.put("result", selectedByDefault);
                } else {
                    boolean res;
                    try {
                        res = expressionParser.evaluate(rule.getCondition(), execution.getInputData());
                    } catch (Exception e) {
                        res = false;
                    }
                    ruleLog.put("result", res);
                }
                evaluatedRules.add(ruleLog);
            }

            logEntry.put("evaluated_rules", evaluatedRules);

            if (!ruleResult.matched()) {
                // No matching rule â€” check if step has any rules at all
                if (rules == null || rules.isEmpty()) {
                    // No rules defined â€” workflow complete after this step
                    logEntry.put("selected_next_step", null);
                    execution.getLogs().add(logEntry);
                    completeExecution(execution);
                    return;
                }
                logEntry.put("errorMessage", "No matching rule found");
                execution.getLogs().add(logEntry);
                failExecution(execution, "No matching rule found at step '" + currentStep.getName() + "'");
                return;
            }

            UUID nextStepId = ruleResult.nextStepId();
            String nameOfNextStep = null;
            if (nextStepId != null) {
                Step nextStep = stepRepository.findById(nextStepId).orElse(null);
                nameOfNextStep = nextStep != null ? nextStep.getName() : "Unknown";
            }
            logEntry.put("selected_next_step", nameOfNextStep);

            execution.getLogs().add(logEntry);
            execution = executionRepository.save(execution);

            if (nextStepId == null) {
                // No next step â€” workflow complete
                completeExecution(execution);
                return;
            }

            currentStepId = nextStepId;
        }
    }

    @Transactional
    public ExecutionResponse resumeExecution(UUID executionId, ApproveStepRequest request, UUID userId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution", "id", executionId));

        if (execution.getCurrentStepId() == null) {
            throw new RuntimeException("Execution " + executionId + " is not paused at any step");
        }

        return approveStep(executionId, execution.getCurrentStepId(), request, userId);
    }

    @Transactional
    public ExecutionResponse approveStep(UUID executionId, UUID stepId, ApproveStepRequest request, UUID userId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution", "id", executionId));

        if (execution.getStatus() != ExecutionStatus.PAUSED && execution.getStatus() != ExecutionStatus.RUNNING && execution.getStatus() != ExecutionStatus.IN_PROGRESS) {
            throw new RuntimeException("Execution is not in a state that can be resumed. Current status: " + execution.getStatus());
        }

        if (!stepId.equals(execution.getCurrentStepId())) {
            throw new RuntimeException("Step " + stepId + " is not the current step awaiting approval");
        }

        User approver = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId.toString()));

        // Log the approval action within the existing step log
        Map<String, Object> targetLog = null;
        for (int i = execution.getLogs().size() - 1; i >= 0; i--) {
            Map<String, Object> logEntry = execution.getLogs().get(i);
            if (stepId.toString().equals(logEntry.get("stepId"))) {
                targetLog = logEntry;
                break;
            }
        }

        if (targetLog != null) {
            targetLog.put("status", Boolean.TRUE.equals(request.getApproved()) ? "COMPLETED" : "FAILED");
            targetLog.put("approverId", userId.toString());
            targetLog.put("approverName", approver.getName());
            targetLog.put("approvalComment", request.getComment());
            targetLog.put("endedAt", LocalDateTime.now().toString());
            if (!Boolean.TRUE.equals(request.getApproved())) {
                targetLog.put("errorMessage", "Rejected by " + approver.getName());
            }
        } else {
            // Fallback if not found for some reason
            Map<String, Object> approvalLog = new LinkedHashMap<>();
            approvalLog.put("action", Boolean.TRUE.equals(request.getApproved()) ? "APPROVED" : "REJECTED");
            approvalLog.put("approverId", userId.toString());
            approvalLog.put("approverName", approver.getName());
            approvalLog.put("comment", request.getComment());
            approvalLog.put("timestamp", LocalDateTime.now().toString());
            execution.getLogs().add(approvalLog);
        }

        if (Boolean.TRUE.equals(request.getApproved())) {
            // Get the current step's rules to find next step
            Step currentStep = stepRepository.findById(stepId)
                    .orElseThrow(() -> new ResourceNotFoundException("Step", "id", stepId));

            List<Rule> rules = currentStep.getRules();
            RuleEngine.RuleEvaluationResult ruleResult = ruleEngine.evaluate(rules, execution.getInputData());

            UUID nextStepId = null;
            if (ruleResult.matched()) {
                nextStepId = ruleResult.nextStepId();
            }

            // Also record evaluated rules for approval steps
            List<Map<String, Object>> ruleEvalLogs = new ArrayList<>();
            for (RuleEngine.RuleEvalLog evalLog : ruleResult.evaluatedRules()) {
                Map<String, Object> ruleLog = new LinkedHashMap<>();
                ruleLog.put("ruleId", evalLog.ruleId().toString());
                ruleLog.put("condition", evalLog.condition());
                ruleLog.put("result", evalLog.result());
                ruleLog.put("priority", evalLog.priority());
                if (evalLog.error() != null) {
                    ruleLog.put("error", evalLog.error());
                }
                ruleEvalLogs.add(ruleLog);
            }
            if (targetLog != null) {
                targetLog.put("evaluatedRules", ruleEvalLogs);
                if (nextStepId != null) {
                    Step nextStep = stepRepository.findById(nextStepId).orElse(null);
                    targetLog.put("selectedNextStep", nextStep != null ? nextStep.getName() : "Unknown");
                } else {
                    targetLog.put("selectedNextStep", null);
                }
            }

            if (nextStepId != null) {
                execution.setCurrentStepId(nextStepId);
                execution = executionRepository.save(execution);
                // Resume execution asynchronously from next step
                runExecutionAsync(execution.getId());
            } else {
                // No next step, complete the workflow
                completeExecution(execution);
            }
        } else {
            // Rejected â€” fail the execution
            execution.setStatus(ExecutionStatus.FAILED);
            execution.setErrorMessage("Step rejected by " + approver.getName() +
                    (request.getComment() != null ? ": " + request.getComment() : ""));
            execution.setEndedAt(LocalDateTime.now());
            execution = executionRepository.save(execution);

            notificationService.createNotification(
                    execution.getTriggeredBy().getId(),
                    execution.getId(),
                    NotificationType.EXECUTION_FAILED,
                    "Execution Failed",
                    "Workflow '" + execution.getWorkflow().getName() + "' was rejected at step approval."
            );
        }

        return toExecutionResponse(execution);
    }

    @Transactional
    public ExecutionResponse cancelExecution(UUID executionId, UUID userId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution", "id", executionId));

        if (execution.getStatus() == ExecutionStatus.COMPLETED || execution.getStatus() == ExecutionStatus.FAILED) {
            throw new RuntimeException("Cannot cancel a finished execution. Current status: " + execution.getStatus());
        }

        execution.setStatus(ExecutionStatus.CANCELLED);
        execution.setEndedAt(LocalDateTime.now());
        execution = executionRepository.save(execution);

        return toExecutionResponse(execution);
    }

    @Transactional
    public ExecutionResponse retryExecution(UUID executionId, UUID userId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution", "id", executionId));

        if (execution.getStatus() != ExecutionStatus.FAILED) {
            throw new RuntimeException("Only failed executions can be retried. Current status: " + execution.getStatus());
        }

        // Find which step failed from the logs
        String failedStepIdStr = null;
        for (int i = execution.getLogs().size() - 1; i >= 0; i--) {
            Map<String, Object> logEntry = execution.getLogs().get(i);
            if ("FAILED".equals(logEntry.get("status")) || logEntry.containsKey("errorMessage")) {
                failedStepIdStr = (String) logEntry.get("stepId");
                if (failedStepIdStr != null) {
                    break;
                }
            }
        }

        if (failedStepIdStr != null) {
            execution.setCurrentStepId(UUID.fromString(failedStepIdStr));
        }

        execution.setRetries(execution.getRetries() + 1);
        execution.setStatus(ExecutionStatus.PENDING);
        execution.setErrorMessage(null);
        execution.setEndedAt(null);

        // Add retry log
        Map<String, Object> retryLog = new LinkedHashMap<>();
        retryLog.put("action", "RETRY");
        retryLog.put("retryCount", execution.getRetries());
        retryLog.put("timestamp", LocalDateTime.now().toString());
        if (failedStepIdStr != null) {
            retryLog.put("resumingFromStepId", failedStepIdStr);
        }
        execution.getLogs().add(retryLog);
        execution = executionRepository.save(execution);

        // Resume from the failed step
        runExecutionAsync(execution.getId());

        return toExecutionResponse(execution);
    }

    @Transactional(readOnly = true)
    public ExecutionResponse getExecution(UUID executionId, UUID userId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution", "id", executionId));
        return toExecutionResponse(execution);
    }

    @Transactional(readOnly = true)
    public List<ExecutionSummaryResponse> getExecutionsByWorkflow(UUID workflowId, UUID userId) {
        return executionRepository.findByWorkflowIdOrderByCreatedAtDesc(workflowId)
                .stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ExecutionSummaryResponse> getAllExecutions(Pageable pageable, UUID userId) {
        return executionRepository.findByTriggeredByIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(UUID userId) {
        // Total workflows for current user
        long totalWorkflows = workflowRepository.countByCreatedById(userId);
        
        // Use active workflows for now since the UI might still expect it
        long activeWorkflows = workflowRepository.findAllByCreatedByIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(w -> w.getStatus() == WorkflowStatus.ACTIVE)
                .count();
        
        long totalExecutions = executionRepository.countByTriggeredById(userId);

        LocalDateTime todayMidnight = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);
        List<Execution> allUserExecutions = executionRepository.findByTriggeredByIdOrderByCreatedAtDesc(userId);
        long executionsToday = allUserExecutions.stream()
                .filter(e -> e.getCreatedAt().isAfter(todayMidnight))
                .count();

        // Success rate this month (using count instead of full lists)
        long completed = executionRepository.countByTriggeredByIdAndStatus(
            userId, ExecutionStatus.COMPLETED);
        long total = executionRepository.countByTriggeredById(userId);
        double successRate = total > 0 ? (completed * 100.0 / total) : 0;
        successRate = Math.round(successRate * 100.0) / 100.0;

        // Pending approvals (IN_PROGRESS or PAUSED)
        long pendingApprovals = allUserExecutions.stream()
            .filter(e -> e.getStatus() == ExecutionStatus.PAUSED || e.getStatus() == ExecutionStatus.IN_PROGRESS)
            .count();

        List<ExecutionSummaryResponse> recentExecutions = executionRepository
                .findTop5ByTriggeredByIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalWorkflows(totalWorkflows)
                .activeWorkflows(activeWorkflows)
                .totalExecutions(totalExecutions)
                .executionsToday(executionsToday)
                .successRate(successRate)
                .pendingApprovals(pendingApprovals)
                .recentExecutions(recentExecutions)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ExecutionSummaryResponse> getRecentExecutions(UUID userId) {
        return executionRepository.findTop5ByTriggeredByIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.flowforge.backend.dto.response.ExecutionTrendResponse> getExecutionTrends(UUID userId) {
        List<com.flowforge.backend.dto.response.ExecutionTrendResponse> trends = new ArrayList<>();
        LocalDate today = LocalDate.now();
        List<Execution> allExecutions = executionRepository.findByTriggeredByIdOrderByCreatedAtDesc(userId);

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

            long successCount = allExecutions.stream()
                    .filter(e -> e.getStatus() == ExecutionStatus.COMPLETED)
                    .filter(e -> e.getCreatedAt().isAfter(startOfDay) && e.getCreatedAt().isBefore(endOfDay))
                    .count();
            
            long failedCount = allExecutions.stream()
                    .filter(e -> e.getStatus() == ExecutionStatus.FAILED)
                    .filter(e -> e.getCreatedAt().isAfter(startOfDay) && e.getCreatedAt().isBefore(endOfDay))
                    .count();

            trends.add(com.flowforge.backend.dto.response.ExecutionTrendResponse.builder()
                    .date(date.toString())
                    .successCount(successCount)
                    .failedCount(failedCount)
                    .build());
        }
        return trends;
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€

    private void failExecution(Execution execution, String errorMessage) {
        execution.setStatus(ExecutionStatus.FAILED);
        execution.setErrorMessage(errorMessage);
        execution.setEndedAt(LocalDateTime.now());
        executionRepository.save(execution);
        log.error("Execution {} failed: {}", execution.getId(), errorMessage);

        notificationService.createNotification(
                execution.getTriggeredBy().getId(),
                execution.getId(),
                NotificationType.EXECUTION_FAILED,
                "Execution Failed",
                "Workflow '" + execution.getWorkflow().getName() + "' failed: " + errorMessage
        );
    }

    private void completeExecution(Execution execution) {
        execution.setStatus(ExecutionStatus.COMPLETED);
        execution.setEndedAt(LocalDateTime.now());
        executionRepository.save(execution);
        log.info("Execution {} completed successfully", execution.getId());

        notificationService.createNotification(
                execution.getTriggeredBy().getId(),
                execution.getId(),
                NotificationType.EXECUTION_COMPLETED,
                "Execution Completed",
                "Workflow '" + execution.getWorkflow().getName() + "' completed successfully."
        );
    }

    private void validateInputData(Map<String, Object> inputData, Map<String, Object> inputSchema) {
        if (inputSchema == null || inputSchema.isEmpty()) return;

        for (Map.Entry<String, Object> entry : inputSchema.entrySet()) {
            String fieldName = entry.getKey();
            Object schemaValue = entry.getValue();
            if (schemaValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> fieldSchema = (Map<String, Object>) schemaValue;
                Boolean required = (Boolean) fieldSchema.get("required");
                if (Boolean.TRUE.equals(required) && !inputData.containsKey(fieldName)) {
                    throw new RuntimeException("Required input field missing: " + fieldName);
                }
            }
        }
    }

    private String calculateDuration(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) return null;
        Duration duration = Duration.between(start, end);
        long minutes = duration.toMinutes();
        long seconds = duration.toSecondsPart();
        if (minutes > 0) {
            return minutes + " minute" + (minutes > 1 ? "s" : "") + " " + seconds + " second" + (seconds != 1 ? "s" : "");
        }
        return seconds + " second" + (seconds != 1 ? "s" : "");
    }

    private ExecutionResponse toExecutionResponse(Execution execution) {
        String currentStepName = null;
        if (execution.getCurrentStepId() != null) {
            currentStepName = stepRepository.findById(execution.getCurrentStepId())
                    .map(Step::getName)
                    .orElse("");
        }

        return ExecutionResponse.builder()
                .id(execution.getId())
                .workflowId(execution.getWorkflow().getId())
                .workflowName(execution.getWorkflow().getName())
                .workflowVersion(execution.getWorkflowVersion())
                .status(execution.getStatus())
                .inputData(execution.getInputData())
                .logs(execution.getLogs())
                .currentStepId(execution.getCurrentStepId())
                .currentStepName(currentStepName)
                .retries(execution.getRetries())
                .errorMessage(execution.getErrorMessage())
                .triggeredById(execution.getTriggeredBy().getId())
                .triggeredByName(execution.getTriggeredBy().getName())
                .startedAt(execution.getStartedAt())
                .endedAt(execution.getEndedAt())
                .createdAt(execution.getCreatedAt())
                .duration(calculateDuration(execution.getStartedAt(), execution.getEndedAt()))
                .build();
    }

    private ExecutionSummaryResponse toSummaryResponse(Execution execution) {
        return ExecutionSummaryResponse.builder()
                .id(execution.getId())
                .workflowId(execution.getWorkflow().getId())
                .workflowName(execution.getWorkflow().getName())
                .workflowVersion(execution.getWorkflow().getVersion())
                .status(execution.getStatus())
                .triggeredByName(execution.getTriggeredBy().getName())
                .startedAt(execution.getStartedAt())
                .endedAt(execution.getEndedAt())
                .duration(calculateDuration(execution.getStartedAt(), execution.getEndedAt()))
                .createdAt(execution.getCreatedAt())
                .build();
    }
}

