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
}

