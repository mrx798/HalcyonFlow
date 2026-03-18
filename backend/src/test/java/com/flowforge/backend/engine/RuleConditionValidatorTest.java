package com.flowforge.backend.engine;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RuleConditionValidatorTest {

    @Test
    void testValidConditionReturnsTrue() {
        RuleConditionValidator.ValidationResult result = RuleConditionValidator.validate("amount > 100 && country == 'US'");
        assertTrue(result.isValid());
        
        result = RuleConditionValidator.validate("amount <= 500");
        assertTrue(result.isValid());
    }

    @Test
    void testInvalidOperatorReturnsFalseWithClearMessage() {
        RuleConditionValidator.ValidationResult result = RuleConditionValidator.validate("amount >> 100");
        assertFalse(result.isValid());
        assertNotNull(result.errorMessage());
        assertTrue(result.errorMessage().contains("Incomplete") || result.errorMessage().contains("Invalid") || result.errorMessage().toLowerCase().contains("missing"));
    }

    @Test
    void testUnbalancedParenthesesReturnsFalse() {
        RuleConditionValidator.ValidationResult result = RuleConditionValidator.validate("(amount > 100");
        assertFalse(result.isValid());
        assertEquals("Unbalanced parentheses in condition", result.errorMessage());
        
        result = RuleConditionValidator.validate("amount > 100)");
        assertFalse(result.isValid());
        assertEquals("Unbalanced parentheses in condition", result.errorMessage());
    }

    @Test
    void testEmptyConditionReturnsFalse() {
        RuleConditionValidator.ValidationResult result = RuleConditionValidator.validate("");
        assertFalse(result.isValid());
        assertEquals("Condition cannot be empty", result.errorMessage());
        
        result = RuleConditionValidator.validate("   ");
        assertFalse(result.isValid());
        assertEquals("Condition cannot be empty", result.errorMessage());
        
        result = RuleConditionValidator.validate(null);
        assertFalse(result.isValid());
        assertEquals("Condition cannot be empty", result.errorMessage());
    }

    @Test
    void testDefaultReturnsTrue() {
        RuleConditionValidator.ValidationResult result = RuleConditionValidator.validate("DEFAULT");
        assertTrue(result.isValid());
        assertEquals("Valid DEFAULT condition", result.errorMessage());
        
        result = RuleConditionValidator.validate("  DEFAULT  ");
        assertTrue(result.isValid());
        assertEquals("Valid DEFAULT condition", result.errorMessage());
    }
}

