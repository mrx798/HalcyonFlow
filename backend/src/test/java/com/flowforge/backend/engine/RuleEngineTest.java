package com.flowforge.backend.engine;

import com.flowforge.backend.entity.Rule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RuleEngineTest {

    private RuleEngine ruleEngine;

    @BeforeEach
    void setUp() {
        ruleEngine = new RuleEngine();
    }

    private Rule createRule(String condition, int priority, boolean isDefault) {
        Rule rule = new Rule();
        rule.setId(UUID.randomUUID());
        rule.setCondition(condition);
        rule.setPriority(priority);
        rule.setIsDefault(isDefault);
        rule.setNextStepId(UUID.randomUUID());
        return rule;
    }

    private Rule createRule(String condition, int priority) {
        return createRule(condition, priority, false);
    }

    // Basic operator tests

    @Test
    void testAmountGreaterThan_True() {
        Rule rule = createRule("amount > 100", 1);
        Map<String, Object> data = Map.of("amount", 150);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
        assertEquals(rule.getId(), result.matchedRule().getId());
    }

    @Test
    void testAmountGreaterThan_False() {
        Rule rule = createRule("amount > 100", 1);
        Map<String, Object> data = Map.of("amount", 50);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertFalse(result.matched());
    }

    @Test
    void testAmountEquals_True() {
        Rule rule = createRule("amount == 100", 1);
        Map<String, Object> data = Map.of("amount", 100);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    @Test
    void testAmountNotEquals_True() {
        Rule rule = createRule("amount != 100", 1);
        Map<String, Object> data = Map.of("amount", 50);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    @Test
    void testAmountGreaterThanOrEquals_True() {
        Rule rule = createRule("amount >= 100", 1);
        Map<String, Object> data = Map.of("amount", 100);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    @Test
    void testAmountLessThanOrEquals_True() {
        Rule rule = createRule("amount <= 50", 1);
        Map<String, Object> data = Map.of("amount", 50);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    // String operator tests

    @Test
    void testStringEquals_True() {
        Rule rule = createRule("country == 'US'", 1);
        Map<String, Object> data = Map.of("country", "US");
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    @Test
    void testStringNotEquals_True() {
        Rule rule = createRule("country != 'US'", 1);
        Map<String, Object> data = Map.of("country", "UK");
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    @Test
    void testStringContains_True() {
        Rule rule = createRule("contains(department, 'Finance')", 1);
        Map<String, Object> data = Map.of("department", "Finance Team");
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    @Test
    void testStringStartsWith_True() {
        Rule rule = createRule("startsWith(name, 'John')", 1);
        Map<String, Object> data = Map.of("name", "Johnny");
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    @Test
    void testStringEndsWith_True() {
        Rule rule = createRule("endsWith(email, '.com')", 1);
        Map<String, Object> data = Map.of("email", "test@test.com");
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    // Compound condition tests

    @Test
    void testCompoundAnd_True() {
        Rule rule = createRule("amount > 100 && country == 'US'", 1);
        Map<String, Object> data = Map.of("amount", 150, "country", "US");
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    @Test
    void testCompoundAnd_False() {
        Rule rule = createRule("amount > 100 && country == 'US'", 1);
        Map<String, Object> data = Map.of("amount", 50, "country", "US");
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertFalse(result.matched());
    }

    @Test
    void testCompoundOr_True() {
        Rule rule = createRule("amount > 100 || country == 'US'", 1);
        Map<String, Object> data = Map.of("amount", 50, "country", "US");
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    @Test
    void testTripleAnd_True() {
        Rule rule = createRule("amount > 100 && country == 'US' && priority == 'High'", 1);
        Map<String, Object> data = Map.of("amount", 150, "country", "US", "priority", "High");
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertTrue(result.matched());
    }

    // DEFAULT rule tests

    @Test
    void testDefaultCondition_AlwaysReturnsTrue() {
        Rule rule = createRule("DEFAULT", 100, true);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), Map.of());
        assertTrue(result.matched());
        assertTrue(result.evaluatedRules().get(0).result());
    }

    @Test
    void testDefaultCondition_SelectedWhenNoOtherMatches() {
        Rule r1 = createRule("amount > 100", 1);
        Rule defaultRule = createRule("DEFAULT", 2, true);
        Map<String, Object> data = Map.of("amount", 50);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(r1, defaultRule), data);
        assertTrue(result.matched());
        assertEquals(defaultRule.getId(), result.matchedRule().getId());
    }

    @Test
    void testDefaultCondition_AlwaysEvaluatedLast() {
        Rule r1 = createRule("amount > 100", 2);
        Rule defaultRule = createRule("DEFAULT", 1, true); // Lower priority number but should be last
        Map<String, Object> data = Map.of("amount", 150);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(defaultRule, r1), data);
        assertTrue(result.matched());
        assertEquals(r1.getId(), result.matchedRule().getId());
        assertEquals(1, result.evaluatedRules().size()); // Stopped before evaluated DEFAULT
    }

    // Priority ordering tests

    @Test
    void testPriorityOrdering_EvaluatedInOrder() {
        Rule r1 = createRule("amount > 50", 2);
        Rule r2 = createRule("amount > 20", 1);
        Map<String, Object> data = Map.of("amount", 100);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(r1, r2), data);
        assertTrue(result.matched());
        assertEquals(r2.getId(), result.matchedRule().getId());
    }

    @Test
    void testPriorityOrdering_FirstMatchWins() {
        Rule r1 = createRule("amount > 100", 1);
        Rule r2 = createRule("amount > 50", 2);
        Map<String, Object> data = Map.of("amount", 150);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(r1, r2), data);
        assertTrue(result.matched());
        assertEquals(r1.getId(), result.matchedRule().getId());
        assertEquals(1, result.evaluatedRules().size()); 
    }

    @Test
    void testPriorityOrdering_NextNotEvaluatedIfFirstMatches() {
        Rule r1 = createRule("amount > 100", 1);
        Rule r2 = createRule("amount < 200", 2);
        Map<String, Object> data = Map.of("amount", 150);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(r1, r2), data);
        assertTrue(result.matched());
        assertEquals(1, result.evaluatedRules().size()); // Only r1 should be evaluated
    }

    // Edge case tests

    @Test
    void testEmptyInputData_NoNpe() {
        Rule rule = createRule("amount > 100", 1);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), new HashMap<>());
        assertFalse(result.matched());
    }

    @Test
    void testNullFieldValue_HandledGracefully() {
        Rule rule = createRule("amount > 100", 1);
        Map<String, Object> data = new HashMap<>();
        data.put("amount", null);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(rule), data);
        assertFalse(result.matched());
    }

    @Test
    void testNestedParentheses() {
        Rule rule = createRule("(amount > 100 && country == 'US') || priority == 'High'", 1);
        
        Map<String, Object> data1 = Map.of("amount", 150, "country", "US", "priority", "Low");
        assertTrue(ruleEngine.evaluate(List.of(rule), data1).matched());
        
        Map<String, Object> data2 = Map.of("amount", 50, "country", "UK", "priority", "High");
        assertTrue(ruleEngine.evaluate(List.of(rule), data2).matched());
        
        Map<String, Object> data3 = Map.of("amount", 50, "country", "US", "priority", "Low");
        assertFalse(ruleEngine.evaluate(List.of(rule), data3).matched());
    }

    @Test
    void testUserCase7_DefaultSelected() {
        // Test 7: Rule selection â€” first rule false, DEFAULT selected
        // rules: [
        //   {priority: 1, condition: "amount > 100", nextStepId: "step-A"},
        //   {priority: 99, condition: "DEFAULT", nextStepId: "step-B"}
        // ]
        // input: {amount: 20}
        // expected selected nextStepId: "step-B"
        Rule r1 = createRule("amount > 100", 1);
        Rule defaultRule = createRule("DEFAULT", 99, true); 
        Map<String, Object> data = Map.of("amount", 20);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(r1, defaultRule), data);
        
        assertTrue(result.matched());
        assertEquals(defaultRule.getId(), result.matchedRule().getId());
        assertEquals(defaultRule.getNextStepId(), result.nextStepId());
    }

    @Test
    void testUserCase8_FirstRuleSelected() {
        // Test 8: Rule selection â€” first rule true, selected
        // rules: [
        //   {priority: 1, condition: "amount > 100", nextStepId: "step-A"},
        //   {priority: 99, condition: "DEFAULT", nextStepId: "step-B"}
        // ]
        // input: {amount: 250}
        // expected selected nextStepId: "step-A"
        Rule r1 = createRule("amount > 100", 1);
        Rule defaultRule = createRule("DEFAULT", 99, true);
        Map<String, Object> data = Map.of("amount", 250);
        RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(List.of(r1, defaultRule), data);
        
        assertTrue(result.matched());
        assertEquals(r1.getId(), result.matchedRule().getId());
        assertEquals(r1.getNextStepId(), result.nextStepId());
    }
}

