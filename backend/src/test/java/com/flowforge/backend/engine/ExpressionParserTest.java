package com.flowforge.backend.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ExpressionParserTest {

    private ExpressionParser parser;

    @BeforeEach
    void setUp() {
        parser = new ExpressionParser();
    }

    @Test
    void testOperatorTypesIndividually() {
        Map<String, Object> data = Map.of("val", 10, "str", "hello");

        assertTrue(parser.evaluate("val == 10", data));
        assertFalse(parser.evaluate("val == 20", data));

        assertTrue(parser.evaluate("val != 20", data));
        assertFalse(parser.evaluate("val != 10", data));

        assertTrue(parser.evaluate("val > 5", data));
        assertFalse(parser.evaluate("val > 15", data));

        assertTrue(parser.evaluate("val < 15", data));
        assertFalse(parser.evaluate("val < 5", data));

        assertTrue(parser.evaluate("val >= 10", data));
        assertFalse(parser.evaluate("val >= 15", data));

        assertTrue(parser.evaluate("val <= 10", data));
        assertFalse(parser.evaluate("val <= 5", data));
    }

    @Test
    void testInvalidConditionHandledGracefully() {
        Map<String, Object> data = Map.of("val", 10);
        assertFalse(parser.evaluate("invalid !! @#$ syntax", data));
    }

    @Test
    void testBalancedParenthesesValidation() {
        Map<String, Object> data = Map.of("val", 10);
        assertTrue(parser.evaluate("((val == 10))", data));
        // Unbalanced will not parse correctly and return false safely
        assertFalse(parser.evaluate("((val == 10)", data));
    }

    @Test
    void testStringFunctionsWithQuotedStrings() {
        Map<String, Object> data = Map.of("note", "important message", "code", "AB123CD");

        assertTrue(parser.evaluate("contains(note, 'port')", data));
        assertFalse(parser.evaluate("contains(note, 'xyz')", data));

        assertTrue(parser.evaluate("startsWith(code, 'AB')", data));
        assertFalse(parser.evaluate("startsWith(code, '12')", data));

        assertTrue(parser.evaluate("endsWith(code, 'CD')", data));
        assertFalse(parser.evaluate("endsWith(code, '12')", data));
        
        assertTrue(parser.evaluate("contains(note, \"port\")", data));
    }

    @Test
    void testUserCase1_AmountFalse() {
        // Test 1: Amount false case
        // condition: "amount > 100 && country == 'US'"
        // input: {amount: 20, country: "US"}
        // expected: false
        Map<String, Object> data = Map.of("amount", 20, "country", "US");
        assertFalse(parser.evaluate("amount > 100 && country == 'US'", data));
    }

    @Test
    void testUserCase2_AmountTrue() {
        // Test 2: Amount true case  
        // condition: "amount > 100 && country == 'US'"
        // input: {amount: 250, country: "US"}
        // expected: true
        Map<String, Object> data = Map.of("amount", 250, "country", "US");
        assertTrue(parser.evaluate("amount > 100 && country == 'US'", data));
    }

    @Test
    void testUserCase3_WrongCountry() {
        // Test 3: Wrong country
        // condition: "amount > 100 && country == 'US'"
        // input: {amount: 250, country: "UK"}
        // expected: false
        Map<String, Object> data = Map.of("amount", 250, "country", "UK");
        assertFalse(parser.evaluate("amount > 100 && country == 'US'", data));
    }

    @Test
    void testUserCase4_DefaultAlwaysTrue() {
        // Test 4: DEFAULT always true
        // condition: "DEFAULT"
        // input: anything
        // expected: true
        assertTrue(parser.evaluate("DEFAULT", Map.of("any", "thing")));
    }

    @Test
    void testUserCase5_OrConditionTrue() {
        // Test 5: OR condition
        // condition: "amount <= 100 || department == 'HR'"
        // input: {amount: 50, department: "Finance"}
        // expected: true (because amount <= 100 is true)
        Map<String, Object> data = Map.of("amount", 50, "department", "Finance");
        assertTrue(parser.evaluate("amount <= 100 || department == 'HR'", data));
    }

    @Test
    void testUserCase6_OrConditionBothFalse() {
        // Test 6: OR condition both false
        // condition: "amount <= 100 || department == 'HR'"
        // input: {amount: 250, department: "Finance"}
        // expected: false
        Map<String, Object> data = Map.of("amount", 250, "department", "Finance");
        assertFalse(parser.evaluate("amount <= 100 || department == 'HR'", data));
    }

    @Test
    void testUserCase9_InvalidConditionFalse() {
        // Test 9: Invalid condition â€” treated as false
        // condition: "invalidField >>> 100"
        // input: {amount: 250}
        // expected: false (no exception thrown to caller)
        Map<String, Object> data = Map.of("amount", 250);
        assertFalse(parser.evaluate("invalidField >>> 100", data));
    }

    @Test
    void testUserCase10_NumberComparisonWithStringInput() {
        // Test 10: Number comparison with string input
        // condition: "amount > 100"
        // input: {amount: "250"} (string not number)
        // expected: true (must parse string to number for comparison)
        Map<String, Object> data = Map.of("amount", "250");
        assertTrue(parser.evaluate("amount > 100", data));
    }
}

