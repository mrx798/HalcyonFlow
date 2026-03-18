package com.flowforge.backend.service;

import com.flowforge.backend.dto.request.WorkflowRequest;
import com.flowforge.backend.dto.response.WorkflowResponse;
import com.flowforge.backend.entity.User;
import com.flowforge.backend.entity.Workflow;
import com.flowforge.backend.enums.WorkflowStatus;
import com.flowforge.backend.exception.ResourceNotFoundException;
import com.flowforge.backend.mapper.WorkflowMapper;
import com.flowforge.backend.repository.UserRepository;
import com.flowforge.backend.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final UserRepository userRepository;
    private final WorkflowMapper workflowMapper;

    @Transactional
    public WorkflowResponse createWorkflow(WorkflowRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Workflow workflow = workflowMapper.toEntity(request);
        workflow.setCreatedBy(user);
        workflow.setVersion(1);
        workflow.setStatus(WorkflowStatus.DRAFT);
        workflow.setIsActive(false);

        Workflow savedWorkflow = workflowRepository.save(workflow);
        return workflowMapper.toResponse(savedWorkflow);
    }

    @Transactional(readOnly = true)
    public Page<WorkflowResponse> getWorkflows(String userEmail, int page, int size, String search) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Pageable pageable = PageRequest.of(page, size);

        Page<Workflow> workflowsPage;
        if (search != null && !search.isBlank()) {
            workflowsPage = workflowRepository.findAllByCreatedByIdAndNameContainingIgnoreCaseOrderByCreatedAtDesc(user.getId(), search, pageable);
        } else {
            workflowsPage = workflowRepository.findAllByCreatedByIdOrderByCreatedAtDesc(user.getId(), pageable);
        }

        return workflowsPage.map(workflowMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public WorkflowResponse getWorkflowById(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Workflow workflow = workflowRepository.findByIdAndCreatedById(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", id.toString()));

        return workflowMapper.toResponse(workflow);
    }

    @Transactional
    public WorkflowResponse updateWorkflow(UUID id, WorkflowRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Workflow workflow = workflowRepository.findByIdAndCreatedById(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", id.toString()));

        workflowMapper.updateEntity(request, workflow);
        workflow.setVersion(workflow.getVersion() + 1);
        Workflow updatedWorkflow = workflowRepository.save(workflow);
        return workflowMapper.toResponse(updatedWorkflow);
    }

    @Transactional(readOnly = true)
    public void deleteWorkflow(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        if (!workflowRepository.existsByIdAndCreatedById(id, user.getId())) {
            throw new ResourceNotFoundException("Workflow", "id", id.toString());
        }

        workflowRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> validateWorkflow(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Workflow workflow = workflowRepository.findByIdAndCreatedById(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", id.toString()));

        List<String> errors = new java.util.ArrayList<>();

        // 1. Has at least one step
        if (workflow.getSteps() == null || workflow.getSteps().isEmpty()) {
            errors.add("Workflow must have at least one step.");
        }

        // 2. Has a startStepId set
        if (workflow.getStartStepId() == null) {
            errors.add("Workflow must have a start step designated.");
        } else {
            // Check if startStepId refers to a step in this workflow
            boolean startStepExists = workflow.getSteps().stream()
                    .anyMatch(s -> s.getId().equals(workflow.getStartStepId()));
            if (!startStepExists) {
                errors.add("Start step ID " + workflow.getStartStepId() + " does not belong to this workflow.");
            }
        }

        if (workflow.getSteps() != null) {
            for (com.flowforge.backend.entity.Step step : workflow.getSteps()) {
                // 3. Every step has at least one rule
                if (step.getRules() == null || step.getRules().isEmpty()) {
                    errors.add("Step '" + step.getName() + "' must have at least one rule.");
                } else {
                    // 4. Every step has a DEFAULT rule
                    boolean hasDefault = step.getRules().stream()
                            .anyMatch(r -> Boolean.TRUE.equals(r.getIsDefault()));
                    if (!hasDefault) {
                        errors.add("Step '" + step.getName() + "' must have a DEFAULT rule.");
                    }

                    // 5. All nextStepIds reference valid steps within the same workflow
                    for (com.flowforge.backend.entity.Rule rule : step.getRules()) {
                        if (rule.getNextStepId() != null) {
                            boolean nextStepExists = workflow.getSteps().stream()
                                    .anyMatch(s -> s.getId().equals(rule.getNextStepId()));
                            if (!nextStepExists) {
                                errors.add("Rule in step '" + step.getName() + "' references next step ID " + 
                                        rule.getNextStepId() + " which does not exist in this workflow.");
                            }
                        }
                    }
                }
            }
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("valid", errors.isEmpty());
        result.put("errors", errors);
        return result;
    }

    @Transactional(readOnly = true)
    public com.flowforge.backend.dto.response.HealthReportResponse getWorkflowHealth(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Workflow workflow = workflowRepository.findByIdAndCreatedById(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", id.toString()));

        List<com.flowforge.backend.dto.response.HealthReportResponse.HealthCheck> checks = new ArrayList<>();
        int score = 100;

        // 1. Check Steps Presence
        if (workflow.getSteps() == null || workflow.getSteps().isEmpty()) {
            checks.add(createCheck("Steps Definition", "FAIL", "Workflow has no steps."));
            score -= 30;
        } else {
            checks.add(createCheck("Steps Definition", "PASS", "Workflow has " + workflow.getSteps().size() + " step(s)."));
        }

        // 2. Check Start Step
        if (workflow.getStartStepId() == null) {
            checks.add(createCheck("Start Step", "FAIL", "Start step is not designated."));
            score -= 20;
        } else {
            boolean exists = workflow.getSteps() != null && workflow.getSteps().stream().anyMatch(s -> s.getId().equals(workflow.getStartStepId()));
            if (!exists) {
                checks.add(createCheck("Start Step", "FAIL", "Start step references a deleted or invalid step."));
                score -= 20;
            } else {
                checks.add(createCheck("Start Step", "PASS", "Start step is correctly designated."));
            }
        }

        // 3. Schema definition
        if (workflow.getInputSchema() == null || workflow.getInputSchema().isEmpty()) {
            checks.add(createCheck("Input Schema", "WARNING", "No input schema defined. Proceeding without typed data."));
            score -= 5;
        } else {
            checks.add(createCheck("Input Schema", "PASS", "Input schema is defined."));
        }

        // 4. Default rules & unreachable steps
        if (workflow.getSteps() != null && !workflow.getSteps().isEmpty()) {
            int missingDefault = 0;
            List<UUID> targetIds = new ArrayList<>();
            for (com.flowforge.backend.entity.Step s : workflow.getSteps()) {
                if (s.getRules() != null) {
                    boolean hasDefault = s.getRules().stream().anyMatch(r -> Boolean.TRUE.equals(r.getIsDefault()));
                    if (!hasDefault) missingDefault++;
                    s.getRules().forEach(r -> { if (r.getNextStepId() != null) targetIds.add(r.getNextStepId()); });
                } else {
                    missingDefault++;
                }
            }

            if (missingDefault > 0) {
                checks.add(createCheck("Default Rules", "FAIL", missingDefault + " step(s) are missing a DEFAULT fallback rule."));
                score -= Math.min(20, missingDefault * 10);
            } else {
                checks.add(createCheck("Default Rules", "PASS", "All steps have DEFAULT fallback rules."));
            }

            // Unreachable steps (not start step, and not targeted by any rule)
            int unreachable = 0;
            for (com.flowforge.backend.entity.Step s : workflow.getSteps()) {
                if (!s.getId().equals(workflow.getStartStepId()) && !targetIds.contains(s.getId())) {
                    unreachable++;
                }
            }
            if (unreachable > 0) {
                checks.add(createCheck("Unreachable Steps", "WARNING", unreachable + " step(s) cannot be reached by any rule."));
                score -= Math.min(15, unreachable * 5);
            } else {
                checks.add(createCheck("Unreachable Steps", "PASS", "All steps are reachable."));
            }
        }

        return com.flowforge.backend.dto.response.HealthReportResponse.builder()
                .score(Math.max(0, score))
                .checks(checks)
                .build();
    }

    private com.flowforge.backend.dto.response.HealthReportResponse.HealthCheck createCheck(String name, String status, String message) {
        return com.flowforge.backend.dto.response.HealthReportResponse.HealthCheck.builder()
                .name(name)
                .status(status)
                .message(message)
                .build();
    }
}

