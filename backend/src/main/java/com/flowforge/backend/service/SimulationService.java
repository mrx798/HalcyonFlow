package com.flowforge.backend.service;

import com.flowforge.backend.dto.*;
import com.flowforge.backend.entity.Step;
import com.flowforge.backend.entity.Workflow;
import com.flowforge.backend.engine.RuleEngine;
import com.flowforge.backend.repository.WorkflowRepository;
import com.flowforge.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Service responsible for simulating workflow executions.
 * Provides a sandbox environment to test workflow logic and routing
 * without persisting actual execution data or triggering side effects.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationService {

    private final WorkflowRepository workflowRepository;
    private final RuleEngine ruleEngine;

    @Transactional(readOnly = true)
    public SimulationResponse simulateWorkflow(UUID workflowId, Map<String, Object> inputData, UUID userId) {
        Workflow workflow = workflowRepository.findByIdAndCreatedById(workflowId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", workflowId.toString()));

        SimulationResponse response = new SimulationResponse();
        response.setWorkflowId(workflow.getId().toString());
        response.setWorkflowName(workflow.getName());
        response.setPath(new ArrayList<>());

        if (workflow.getStartStepId() == null) {
            response.setSimulatedSuccess(false);
            response.setSimulationError("Workflow has no start step configured.");
            return response;
        }

        Map<UUID, Step> stepMap = new java.util.HashMap<>();
        for (Step s : workflow.getSteps()) {
            stepMap.put(s.getId(), s);
        }

        UUID currentStepId = workflow.getStartStepId();
        Set<UUID> visitedSteps = new HashSet<>();
        int sequenceIndex = 1;

        while (currentStepId != null) {
            Step currentStep = stepMap.get(currentStepId);
            
            if (currentStep == null) {
                response.setSimulatedSuccess(false);
                response.setSimulationError("Invalid step ID in execution path: " + currentStepId);
                return response;
            }

            SimulationResponse.SimulationStep simStep = new SimulationResponse.SimulationStep();
            simStep.setStepId(currentStep.getId().toString());
            simStep.setStepName(currentStep.getName());
            simStep.setStepType(currentStep.getStepType() != null ? currentStep.getStepType().name() : "TASK");
            simStep.setSequenceIndex(sequenceIndex++);
            response.getPath().add(simStep);

            if (visitedSteps.contains(currentStepId)) {
                simStep.setError("Infinite loop detected.");
                response.setSimulatedSuccess(false);
                response.setSimulationError("Workflow contains an infinite loop.");
                return response;
            }
            visitedSteps.add(currentStepId);

            simStep.setRulesEvaluated(true);
            try {
                RuleEngine.RuleEvaluationResult ruleResult = ruleEngine.evaluate(currentStep.getRules(), inputData);
                
                if (ruleResult.matched()) {
                    simStep.setMatchedRuleCondition(ruleResult.matchedRule().getCondition());
                    currentStepId = ruleResult.nextStepId(); // might be null, which normally terminates
                } else {
                    simStep.setError("No rules matched and no DEFAULT rule.");
                    response.setSimulatedSuccess(false);
                    response.setSimulationError("Execution stalled at step '" + currentStep.getName() + "' because no rules matched.");
                    return response;
                }
            } catch (Exception e) {
                 simStep.setError("Rule evaluation error: " + e.getMessage());
                 response.setSimulatedSuccess(false);
                 response.setSimulationError("Failed processing step '" + currentStep.getName() + "'.");
                 return response;
            }
        }

        response.setSimulatedSuccess(true);
        return response;
    }
}
