package com.flowforge.backend.service;

import com.flowforge.backend.dto.request.CreateRuleRequest;
import com.flowforge.backend.dto.request.ReorderRulesRequest;
import com.flowforge.backend.dto.request.UpdateRuleRequest;
import com.flowforge.backend.dto.response.RuleResponse;
import com.flowforge.backend.engine.RuleConditionValidator;
import com.flowforge.backend.entity.Rule;
import com.flowforge.backend.entity.Step;
import com.flowforge.backend.entity.Workflow;
import com.flowforge.backend.exception.ResourceNotFoundException;
import com.flowforge.backend.mapper.RuleMapper;
import com.flowforge.backend.repository.RuleRepository;
import com.flowforge.backend.repository.StepRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class RuleService {

    private final RuleRepository ruleRepository;
    private final StepRepository stepRepository;
    private final RuleMapper ruleMapper;

    @Transactional
    public RuleResponse createRule(UUID stepId, CreateRuleRequest request, UUID userId) {
        // FIX 1: Null check on step
        Step step = stepRepository.findById(stepId)
            .orElseThrow(() -> new ResourceNotFoundException("Step", "id", stepId.toString()));
        
        // FIX 2: Verify ownership through workflow
        Workflow workflow = step.getWorkflow();
        if (!workflow.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // FIX 3: Handle isDefault null
        boolean isDefault = request.getIsDefault() != null && request.getIsDefault();
        
        // FIX 4: Handle DEFAULT condition
        String condition = request.getCondition();
        if (isDefault) {
            condition = "DEFAULT";
        }
        
        // FIX 5: Validate condition (wrap in try-catch)
        try {
            RuleConditionValidator.ValidationResult result = RuleConditionValidator.validate(condition);
            if (!result.isValid()) {
                throw new RuntimeException("Invalid condition: " + result.errorMessage());
            }
        } catch (Exception e) {
            if (!(e instanceof RuntimeException)) {
                throw new RuntimeException("Condition validation error: " + e.getMessage());
            }
            throw e;
        }
        
        // FIX 6: Auto-assign priority if null
        Integer priority = request.getPriority();
        if (priority == null) {
            Integer maxPriority = ruleRepository.findMaxPriorityByStepId(stepId);
            priority = (maxPriority == null) ? 10 : maxPriority + 10;
        }
        
        // FIX 7: Handle nextStepId null safely
        UUID nextStepId = request.getNextStepId(); // null is valid
        
        Rule rule = Rule.builder()
            .step(step)
            .condition(condition)
            .nextStepId(nextStepId)
            .priority(priority)
            .isDefault(isDefault)
            .build();
        
        Rule saved = ruleRepository.save(rule);
        return ruleMapper.toResponse(saved);
    }
    @Transactional(readOnly = true)
    public List<RuleResponse> getRulesByStep(UUID stepId, UUID userId) {
        getStepForUser(stepId, userId);

        List<Rule> rules = ruleRepository.findByStepIdOrderByPriorityAsc(stepId);

        // Ensure DEFAULT rule appears last
        rules.sort(Comparator.<Rule, Boolean>comparing(r -> Boolean.TRUE.equals(r.getIsDefault()))
                .thenComparing(Rule::getPriority));

        return rules.stream()
                .map(ruleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RuleResponse getRuleById(UUID ruleId, UUID stepId, UUID userId) {
        getStepForUser(stepId, userId);

        Rule rule = ruleRepository.findByIdAndStepId(ruleId, stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule", "id", ruleId.toString()));

        return ruleMapper.toResponse(rule);
    }

    @Transactional
    public RuleResponse updateRule(UUID ruleId, UUID stepId, UpdateRuleRequest request, UUID userId) {
        getStepForUser(stepId, userId);

        Rule rule = ruleRepository.findByIdAndStepId(ruleId, stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule", "id", ruleId.toString()));

        // Cannot change a DEFAULT rule's condition away from "DEFAULT"
        if (Boolean.TRUE.equals(rule.getIsDefault()) && request.getCondition() != null
                && !"DEFAULT".equals(request.getCondition())) {
            throw new RuntimeException("Cannot change a DEFAULT rule's condition. Delete and recreate instead.");
        }

        // Validate condition if provided
        if (request.getCondition() != null) {
            RuleConditionValidator.ValidationResult validationResult =
                    RuleConditionValidator.validate(request.getCondition());
            if (!validationResult.isValid()) {
                throw new RuntimeException("Invalid condition: " + validationResult.errorMessage());
            }
        }

        // Check priority conflict if changing priority
        if (request.getPriority() != null && !request.getPriority().equals(rule.getPriority())) {
            if (ruleRepository.existsByStepIdAndPriority(stepId, request.getPriority())) {
                throw new RuntimeException("Priority " + request.getPriority() + " is already taken for this step");
            }
        }

        ruleMapper.updateEntity(request, rule);
        Rule updatedRule = ruleRepository.save(rule);
        return ruleMapper.toResponse(updatedRule);
    }

    @Transactional
    public void deleteRule(UUID ruleId, UUID stepId, UUID userId) {
        getStepForUser(stepId, userId);

        Rule rule = ruleRepository.findByIdAndStepId(ruleId, stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule", "id", ruleId.toString()));

        // Cannot delete DEFAULT rule if other rules exist
        if (Boolean.TRUE.equals(rule.getIsDefault())) {
            Integer ruleCount = ruleRepository.countByStepId(stepId);
            if (ruleCount > 1) {
                throw new RuntimeException("Cannot delete DEFAULT rule while other rules exist. Delete other rules first.");
            }
        }

        ruleRepository.delete(rule);
    }

    @Transactional
    public List<RuleResponse> reorderRules(UUID stepId, ReorderRulesRequest request, UUID userId) {
        getStepForUser(stepId, userId);

        // Find the default rule to ensure it stays at max priority
        Rule defaultRule = ruleRepository.findByStepIdAndIsDefaultTrue(stepId).orElse(null);
        int maxNewPriority = 0;

        for (ReorderRulesRequest.RulePriorityItem item : request.getRulePriorities()) {
            Rule rule = ruleRepository.findByIdAndStepId(item.getRuleId(), stepId)
                    .orElseThrow(() -> new ResourceNotFoundException("Rule", "id", item.getRuleId().toString()));

            if (!Boolean.TRUE.equals(rule.getIsDefault())) {
                rule.setPriority(item.getNewPriority());
                ruleRepository.save(rule);
            }
            if (item.getNewPriority() > maxNewPriority) {
                maxNewPriority = item.getNewPriority();
            }
        }

        // Keep DEFAULT rule at highest priority
        if (defaultRule != null && defaultRule.getPriority() <= maxNewPriority) {
            defaultRule.setPriority(maxNewPriority + 10);
            ruleRepository.save(defaultRule);
        }

        return getRulesByStep(stepId, userId);
    }

    /**
     * Verifies the step exists and its parent workflow belongs to the authenticated user.
     */
    private Step getStepForUser(UUID stepId, UUID userId) {
        Step step = stepRepository.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Step", "id", stepId.toString()));

        Workflow workflow = step.getWorkflow();
        if (!workflow.getCreatedBy().getId().equals(userId)) {
            throw new ResourceNotFoundException("Workflow", "id", workflow.getId().toString());
        }

        return step;
    }
}

