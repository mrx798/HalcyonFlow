package com.flowforge.backend.engine;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Validates rule condition syntax before persisting.
 * Supports: ==, !=, <, >, <=, >=, &&, ||, contains(), startsWith(), endsWith(), DEFAULT
 */
public final class RuleConditionValidator {

    private static final Pattern FUNCTION_PATTERN =
            Pattern.compile("(contains|startsWith|endsWith)\\s*\\(\\s*([a-zA-Z_][a-zA-Z0-9_.]*?)\\s*,\\s*\"([^\"]*?)\"\\s*\\)");

    private static final Pattern COMPARISON_OPERATOR_PATTERN =
            Pattern.compile("(==|!=|<=|>=|<|>)");

    private static final Pattern IDENTIFIER_PATTERN =
            Pattern.compile("[a-zA-Z_][a-zA-Z0-9_.]*");

    private static final Pattern NUMBER_PATTERN =
            Pattern.compile("-?\\d+(\\.\\d+)?");

    private static final Pattern STRING_LITERAL_PATTERN =
            Pattern.compile("'[^']*'|\"[^\"]*\"");

    private RuleConditionValidator() {
        // Utility class
    }

    /**
     * Validates a rule condition expression.
     *
     * @param condition the condition string to validate
     * @return ValidationResult indicating whether the condition is valid
     */
    public static ValidationResult validate(String condition) {
        if (condition == null || condition.isBlank()) {
            return new ValidationResult(false, "Condition cannot be empty");
        }

        String trimmed = condition.trim();

        // DEFAULT is always valid
        if ("DEFAULT".equals(trimmed)) {
            return new ValidationResult(true, "Valid DEFAULT condition");
        }

        // Check balanced parentheses
        if (!areParenthesesBalanced(trimmed)) {
            return new ValidationResult(false, "Unbalanced parentheses in condition");
        }

        // Check for dangling logical operators at start or end
        if (trimmed.startsWith("&&") || trimmed.startsWith("||")) {
            return new ValidationResult(false, "Condition cannot start with a logical operator (&& or ||)");
        }
        if (trimmed.endsWith("&&") || trimmed.endsWith("||")) {
            return new ValidationResult(false, "Condition cannot end with a logical operator (&& or ||)");
        }

        // Validate function calls: contains(), startsWith(), endsWith()
        String withoutFunctions = validateAndRemoveFunctions(trimmed);
        if (withoutFunctions == null) {
            return new ValidationResult(false, "Invalid function call syntax. Expected format: functionName(identifier, \"value\"). Supported functions: contains, startsWith, endsWith");
        }

        // Validate comparison operators
        ValidationResult operatorResult = validateOperators(withoutFunctions);
        if (!operatorResult.isValid()) {
            return operatorResult;
        }

        // Validate individual tokens in simple comparisons
        ValidationResult tokenResult = validateTokens(withoutFunctions);
        if (!tokenResult.isValid()) {
            return tokenResult;
        }

        return new ValidationResult(true, "Valid condition");
    }

    private static boolean areParenthesesBalanced(String expr) {
        int count = 0;
        for (char c : expr.toCharArray()) {
            if (c == '(') count++;
            else if (c == ')') count--;
            if (count < 0) return false;
        }
        return count == 0;
    }

    /**
     * Validates function calls and replaces them with a placeholder token for further analysis.
     * Returns null if any function call is invalid.
     */
    private static String validateAndRemoveFunctions(String expr) {
        // Check for function-like patterns that are malformed
        Pattern badFunctionPattern = Pattern.compile("(contains|startsWith|endsWith)\\s*\\(");
        Matcher badMatcher = badFunctionPattern.matcher(expr);
        Matcher goodMatcher = FUNCTION_PATTERN.matcher(expr);

        // Count bad matches and good matches
        int badCount = 0;
        while (badMatcher.find()) badCount++;
        int goodCount = 0;
        while (goodMatcher.find()) goodCount++;

        // If there are more function openings than valid functions, something is wrong
        if (badCount > goodCount) {
            return null;
        }

        // Replace valid functions with a placeholder
        return FUNCTION_PATTERN.matcher(expr).replaceAll("__FUNC_RESULT__");
    }

    private static ValidationResult validateOperators(String expr) {
        // Split by logical operators and validate each segment
        String[] segments = expr.split("\\s*(&&|\\|\\|)\\s*");
        for (String segment : segments) {
            String seg = segment.trim();
            if (seg.isEmpty()) {
                return new ValidationResult(false, "Empty expression segment found near a logical operator (&& or ||)");
            }
        }
        return new ValidationResult(true, "Valid operators");
    }

    private static ValidationResult validateTokens(String expr) {
        // Split by logical operators
        String[] segments = expr.split("\\s*(&&|\\|\\|)\\s*");
        for (String segment : segments) {
            String seg = segment.trim();
            // Remove surrounding parentheses
            while (seg.startsWith("(") && seg.endsWith(")")) {
                seg = seg.substring(1, seg.length() - 1).trim();
            }

            // If it's a function placeholder, skip validation
            if (seg.equals("__FUNC_RESULT__") || seg.contains("__FUNC_RESULT__")) {
                continue;
            }

            // Should contain a comparison operator
            Matcher compMatcher = COMPARISON_OPERATOR_PATTERN.matcher(seg);
            if (!compMatcher.find()) {
                // It could be a standalone boolean identifier â€” allow it
                if (IDENTIFIER_PATTERN.matcher(seg).matches()) {
                    continue;
                }
                return new ValidationResult(false,
                        "Expression segment '" + seg + "' is missing a comparison operator (==, !=, <, >, <=, >=)");
            }

            // Split on the first comparison operator and validate both sides
            String[] parts = seg.split("\\s*(==|!=|<=|>=|<|>)\\s*", 2);
            if (parts.length != 2) {
                return new ValidationResult(false,
                        "Expression segment '" + seg + "' has an incomplete comparison");
            }

            String left = parts[0].trim();
            String right = parts[1].trim();

            if (!isValidToken(left)) {
                return new ValidationResult(false, "Invalid left-hand side token: '" + left + "'");
            }
            if (!isValidToken(right)) {
                return new ValidationResult(false, "Invalid right-hand side token: '" + right + "'");
            }
        }
        return new ValidationResult(true, "Valid tokens");
    }

    private static boolean isValidToken(String token) {
        if (token.isEmpty()) return false;
        // Remove wrapping parentheses
        while (token.startsWith("(") && token.endsWith(")")) {
            token = token.substring(1, token.length() - 1).trim();
        }
        // Valid: identifier, number, string literal, boolean, or function placeholder
        return IDENTIFIER_PATTERN.matcher(token).matches()
                || NUMBER_PATTERN.matcher(token).matches()
                || STRING_LITERAL_PATTERN.matcher(token).matches()
                || "true".equals(token)
                || "false".equals(token)
                || "null".equals(token)
                || token.contains("__FUNC_RESULT__");
    }

    /**
     * Result of condition validation.
     */
    public record ValidationResult(boolean isValid, String errorMessage) {
    }
}

