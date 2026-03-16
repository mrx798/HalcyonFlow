package com.flowforge.backend.engine;

import com.flowforge.backend.entity.Rule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Evaluates all rules for a step and returns the first matching rule.
 * Rules are evaluated in priority order (lowest number first), with DEFAULT always last.
 */
@Component
public class RuleEngine {

    private static final Logger log = LoggerFactory.getLogger(RuleEngine.class);

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

        // Sort: non-default by priority ASC, then DEFAULT last
        List<Rule> sorted = new ArrayList<>(rules);
        sorted.sort(Comparator
                .<Rule, Boolean>comparing(r -> Boolean.TRUE.equals(r.getIsDefault()))
                .thenComparing(Rule::getPriority));

        List<RuleEvalLog> evalLogs = new ArrayList<>();

        for (Rule rule : sorted) {
            boolean result = expressionParser.evaluate(rule.getCondition(), inputData);
            evalLogs.add(new RuleEvalLog(
                    rule.getId(),
                    rule.getCondition(),
                    result,
                    rule.getPriority()
            ));

            log.debug("Rule [{}] condition='{}' priority={} → {}",
                    rule.getId(), rule.getCondition(), rule.getPriority(), result);

            if (result) {
                return new RuleEvaluationResult(true, rule, rule.getNextStepId(), evalLogs);
            }
        }

        // No rule matched
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
            int priority
    ) {}
}
