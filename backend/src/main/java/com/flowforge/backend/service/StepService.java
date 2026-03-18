package com.flowforge.backend.service;

import com.flowforge.backend.dto.request.CreateStepRequest;
import com.flowforge.backend.dto.request.ReorderStepsRequest;
import com.flowforge.backend.dto.request.UpdateStepRequest;
import com.flowforge.backend.dto.response.StepDetailResponse;
import com.flowforge.backend.dto.response.StepResponse;
import com.flowforge.backend.entity.Step;
import com.flowforge.backend.entity.Workflow;
import com.flowforge.backend.exception.ResourceNotFoundException;
import com.flowforge.backend.mapper.StepMapper;
import com.flowforge.backend.repository.StepRepository;
import com.flowforge.backend.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class StepService {

    private final StepRepository stepRepository;
    private final WorkflowRepository workflowRepository;
    private final StepMapper stepMapper;

    @Transactional
    public StepResponse createStep(CreateStepRequest request, UUID userId) {
        Workflow workflow = getWorkflowForUser(request.getWorkflowId(), userId);

        // Determine step order
        Integer stepOrder = request.getStepOrder();
        if (stepOrder == null) {
            Integer maxOrder = stepRepository.findMaxStepOrderByWorkflowId(workflow.getId());
            stepOrder = (maxOrder != null ? maxOrder : 0) + 1;
        } else {
            if (stepRepository.existsByWorkflowIdAndStepOrder(workflow.getId(), stepOrder)) {
                throw new RuntimeException("Step order " + stepOrder + " is already taken in this workflow");
            }
        }

        Step step = stepMapper.toEntity(request);
        step.setWorkflow(workflow);
        step.setStepOrder(stepOrder);

        Step savedStep = stepRepository.save(step);

        // If this is the first step, set it as the workflow's startStepId
        List<Step> existingSteps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflow.getId());
        if (existingSteps.size() == 1) {
            workflow.setStartStepId(savedStep.getId());
            workflowRepository.save(workflow);
        }

        return stepMapper.toResponse(savedStep);
    }

    @Transactional(readOnly = true)
    public List<StepResponse> getStepsByWorkflow(UUID workflowId, UUID userId) {
        getWorkflowForUser(workflowId, userId);

        return stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowId)
                .stream()
                .map(stepMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StepDetailResponse getStepById(UUID stepId, UUID workflowId, UUID userId) {
        getWorkflowForUser(workflowId, userId);

        Step step = stepRepository.findByIdAndWorkflowId(stepId, workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Step", "id", stepId.toString()));

        return stepMapper.toDetailResponse(step);
    }

    @Transactional
    public StepResponse updateStep(UUID stepId, UUID workflowId, UpdateStepRequest request, UUID userId) {
        getWorkflowForUser(workflowId, userId);

        Step step = stepRepository.findByIdAndWorkflowId(stepId, workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Step", "id", stepId.toString()));

        stepMapper.updateEntity(request, step);
        Step updatedStep = stepRepository.save(step);
        return stepMapper.toResponse(updatedStep);
    }

    @Transactional
    public void deleteStep(UUID stepId, UUID workflowId, UUID userId) {
        Workflow workflow = getWorkflowForUser(workflowId, userId);

        Step step = stepRepository.findByIdAndWorkflowId(stepId, workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Step", "id", stepId.toString()));

        // If deleting the startStepId step, update workflow's startStepId
        if (step.getId().equals(workflow.getStartStepId())) {
            List<Step> allSteps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowId);
            UUID nextStartStepId = allSteps.stream()
                    .filter(s -> !s.getId().equals(stepId))
                    .findFirst()
                    .map(Step::getId)
                    .orElse(null);
            workflow.setStartStepId(nextStartStepId);
            workflowRepository.save(workflow);
        }

        stepRepository.delete(step);

        // Reorder remaining steps sequentially (1, 2, 3...)
        List<Step> remainingSteps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowId);
        int order = 1;
        for (Step s : remainingSteps) {
            s.setStepOrder(order++);
        }
        stepRepository.saveAll(remainingSteps);
    }

    @Transactional
    public List<StepResponse> reorderSteps(UUID workflowId, ReorderStepsRequest request, UUID userId) {
        getWorkflowForUser(workflowId, userId);

        for (ReorderStepsRequest.StepOrderItem item : request.getStepOrders()) {
            Step step = stepRepository.findByIdAndWorkflowId(item.getStepId(), workflowId)
                    .orElseThrow(() -> new ResourceNotFoundException("Step", "id", item.getStepId().toString()));
            step.setStepOrder(item.getNewOrder());
            stepRepository.save(step);
        }

        return stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowId)
                .stream()
                .map(stepMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Verifies the workflow exists and belongs to the authenticated user.
     */
    private Workflow getWorkflowForUser(UUID workflowId, UUID userId) {
        return workflowRepository.findByIdAndCreatedById(workflowId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", workflowId.toString()));
    }
}

