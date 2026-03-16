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
        
        // Double quotes should work too
        assertTrue(parser.evaluate("contains(note, \"port\")", data));
    }
}
