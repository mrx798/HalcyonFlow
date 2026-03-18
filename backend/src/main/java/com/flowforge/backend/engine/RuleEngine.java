package com.flowforge.backend.engine;

import com.flowforge.backend.entity.Rule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import com.flowforge.backend.constants.AppConstants;

/**
 * Central engine responsible for evaluating rules and determining workflow routing.
 *
 * <p>Rule Selection Algorithm:</p>
 * <ol>
 *   <li>Rules are sorted by priority in ascending order (lowest number evaluated first).</li>
 *   <li>The DEFAULT rule is separated from the expression-based regular rules.</li>
 *   <li>Regular rules are evaluated sequentially. The first rule to evaluate to {@code true} wins.</li>
 *   <li>If no regular rule evaluates to true, the DEFAULT rule is automatically selected as a fallback.</li>
 *   <li>If no rules match and no DEFAULT rule exists, the step halts with no matching rule.</li>
 * </ol>
 *
 * @author Sharath
 * @version 1.0
 * @since 2026
 */
@Component
@Slf4j
public class RuleEngine {

    private final ExpressionParser expressionParser;

    public RuleEngine() {
        this.expressionParser = new ExpressionParser();
    }

    /**
     * Evaluates rules against input data and returns the result.
     *
     * @param rules     the list of rules to evaluate
     * @param inputData the execution input data
     * @return RuleEvaluationResult with the matched rule and evaluation logs
     */
    public RuleEvaluationResult evaluate(List<Rule> rules, Map<String, Object> inputData) {
        if (rules == null || rules.isEmpty()) {
            return new RuleEvaluationResult(false, null, null, List.of());
        }

        // Step 1: Sort rules by priority ascending (lowest number first)
        List<Rule> sorted = rules.stream()
                .sorted(Comparator.comparingInt(Rule::getPriority))
                .collect(Collectors.toList());

        // Step 2: Separate DEFAULT rule from regular rules
        Rule defaultRule = null;
        List<Rule> regularRules = new ArrayList<>();

        for (Rule rule : sorted) {
            if (AppConstants.RULE_DEFAULT.equals(rule.getCondition())) {
                defaultRule = rule;
            } else {
                regularRules.add(rule);
            }
        }

        List<RuleEvalLog> evalLogs = new ArrayList<>();

        // Step 3: Evaluate regular rules in priority order
        for (Rule rule : regularRules) {
            boolean result = false;
            String error = null;
            try {
                result = expressionParser.evaluate(rule.getCondition(), inputData);
            } catch (Exception e) {
                // Log error, treat as false, continue to next rule
                error = e.getMessage();
                log.error("Rule evaluation failed for condition '{}': {}", rule.getCondition(), error);
                result = false;
            }

            evalLogs.add(new RuleEvalLog(
                    rule.getId(),
                    rule.getCondition(),
                    result,
                    rule.getPriority(),
                    error
            ));

            // Step 4: First TRUE rule wins â€” return its next step
            if (result) {
                return new RuleEvaluationResult(true, rule, rule.getNextStepId(), evalLogs);
            }
        }

        // Step 5: No regular rule matched â€” use DEFAULT
        if (defaultRule != null) {
            evalLogs.add(new RuleEvalLog(
                    defaultRule.getId(),
                    defaultRule.getCondition(),
                    true,
                    defaultRule.getPriority(),
                    null
            ));
            return new RuleEvaluationResult(true, defaultRule, defaultRule.getNextStepId(), evalLogs);
        }

        // Step 6: No match and no DEFAULT rule
        return new RuleEvaluationResult(false, null, null, evalLogs);
    }

    /**
     * Result of evaluating a set of rules.
     */
    public record RuleEvaluationResult(
            boolean matched,
            Rule matchedRule,
            UUID nextStepId,
            List<RuleEvalLog> evaluatedRules
    ) {}

    /**
     * Log entry for a single rule evaluation.
     */
    public record RuleEvalLog(
            UUID ruleId,
            String condition,
            boolean result,
            int priority,
            String error
    ) {}
}

