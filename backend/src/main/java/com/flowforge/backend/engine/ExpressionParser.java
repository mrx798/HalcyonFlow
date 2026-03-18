package com.flowforge.backend.engine;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Core expression evaluator that parses and evaluates rule condition strings
 * against a map of input data. Supports comparison, logical, and string function operators.
 */
public class ExpressionParser {

    private static final Logger log = LoggerFactory.getLogger(ExpressionParser.class);
    private static final Pattern FUNCTION_PATTERN =
            Pattern.compile("(contains|startsWith|endsWith)\\s*\\(\\s*([a-zA-Z_][a-zA-Z0-9_.]*)\\s*,\\s*[\"']([^\"']*)[\"']\\s*\\)");

    /**
     * Evaluates a condition string against the provided input data.
     *
     * @param condition the condition expression
     * @param data      the input data map
     * @return true if the condition matches, false otherwise
     */
    public boolean evaluate(String condition, Map<String, Object> data) {
        if (condition == null || condition.isBlank()) {
            return false;
        }

        String trimmed = condition.trim();

        // DEFAULT always matches
        if ("DEFAULT".equals(trimmed)) {
            return true;
        }

        try {
            return evaluateExpression(trimmed, data);
        } catch (Exception e) {
            log.error("Rule evaluation failed for condition '{}': {}", condition, e.getMessage());
            return false;
        }
    }

    /**
     * Evaluates a condition string against the provided input data and provides a step-by-step explanation.
     *
     * @param condition the condition expression
     * @param data      the input data map
     * @return a ConditionTestResponse containing the result, explanation, and test data
     */
    public com.flowforge.backend.dto.ConditionTestResponse evaluateWithExplanation(String condition, Map<String, Object> data) {
        com.flowforge.backend.dto.ConditionTestResponse response = new com.flowforge.backend.dto.ConditionTestResponse();
        response.setCondition(condition);
        response.setTestData(data);
        java.util.List<com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep> explanation = new java.util.ArrayList<>();
        
        if (condition == null || condition.isBlank()) {
            response.setResult(false);
            explanation.add(new com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep("Empty Condition", "", false));
            response.setExplanation(explanation);
            return response;
        }

        String trimmed = condition.trim();

        if ("DEFAULT".equals(trimmed)) {
            response.setResult(true);
            explanation.add(new com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep("DEFAULT", "always evaluates to true", true));
            response.setExplanation(explanation);
            return response;
        }

        try {
            boolean result = evaluateExpressionWithExplanation(trimmed, data, explanation);
            response.setResult(result);
        } catch (Exception e) {
            log.error("Rule evaluation explanation failed for condition '{}': {}", condition, e.getMessage());
            response.setResult(false);
            explanation.add(new com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep("Error parsing condition", e.getMessage(), false));
        }

        response.setExplanation(explanation);
        return response;
    }

    private boolean evaluateExpressionWithExplanation(String expr, Map<String, Object> data, java.util.List<com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep> explanation) {
        expr = expr.trim();

        while (expr.startsWith("(") && findMatchingParen(expr, 0) == expr.length() - 1) {
            expr = expr.substring(1, expr.length() - 1).trim();
        }

        int orIndex = findTopLevelOperator(expr, "||");
        if (orIndex >= 0) {
            String left = expr.substring(0, orIndex).trim();
            String right = expr.substring(orIndex + 2).trim();
            boolean leftResult = evaluateExpressionWithExplanation(left, data, explanation);
            if (leftResult) {
               explanation.add(new com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep("OR short-circuit", true));
               return true;
            }
            boolean rightResult = evaluateExpressionWithExplanation(right, data, explanation);
            boolean result = leftResult || rightResult;
            explanation.add(new com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep("OR", result));
            return result;
        }

        int andIndex = findTopLevelOperator(expr, "&&");
        if (andIndex >= 0) {
            String left = expr.substring(0, andIndex).trim();
            String right = expr.substring(andIndex + 2).trim();
            boolean leftResult = evaluateExpressionWithExplanation(left, data, explanation);
            if (!leftResult) {
               explanation.add(new com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep("AND short-circuit", false));
               return false;
            }
            boolean rightResult = evaluateExpressionWithExplanation(right, data, explanation);
            boolean result = leftResult && rightResult;
            explanation.add(new com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep("AND", result));
            return result;
        }

        Matcher funcMatcher = FUNCTION_PATTERN.matcher(expr);
        if (funcMatcher.matches()) {
            String funcName = funcMatcher.group(1);
            String fieldName = funcMatcher.group(2);
            String value = funcMatcher.group(3);
            boolean result = evaluateFunction(funcName, fieldName, value, data);
            
            Object actualValue = data.get(fieldName);
            String valStr = actualValue != null ? String.valueOf(actualValue) : "null";
            explanation.add(new com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep(expr, funcName + "('" + valStr + "', '" + value + "')", result));
            return result;
        }

        return evaluateComparisonWithExplanation(expr, data, explanation);
    }
    
    private boolean evaluateComparisonWithExplanation(String expr, Map<String, Object> data, java.util.List<com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep> explanation) {
        String[][] operators = {{"!=", "NE"}, {"==", "EQ"}, {"<=", "LE"}, {">=", "GE"}, {"<", "LT"}, {">", "GT"}};

        for (String[] op : operators) {
            int idx = findComparisonOperator(expr, op[0]);
            if (idx >= 0) {
                String left = expr.substring(0, idx).trim();
                String right = expr.substring(idx + op[0].length()).trim();
                Object leftVal = resolveValue(left, data);
                Object rightVal = resolveValue(right, data);
                boolean result = compare(leftVal, rightVal, op[0]);
                
                String leftStr = leftVal instanceof String ? "'" + leftVal + "'" : String.valueOf(leftVal);
                String rightStr = rightVal instanceof String ? "'" + rightVal + "'" : String.valueOf(rightVal);
                explanation.add(new com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep(expr, leftStr + " " + op[0] + " " + rightStr, result));
                return result;
            }
        }

        Object val = resolveValue(expr, data);
        boolean result;
        if (val instanceof Boolean) {
            result = (Boolean) val;
        } else {
            result = val != null;
        }
        
        explanation.add(new com.flowforge.backend.dto.ConditionTestResponse.ExplanationStep(expr, String.valueOf(val), result));
        return result;
    }

    private boolean evaluateExpression(String expr, Map<String, Object> data) {
        expr = expr.trim();

        // Handle outermost matching parentheses
        while (expr.startsWith("(") && findMatchingParen(expr, 0) == expr.length() - 1) {
            expr = expr.substring(1, expr.length() - 1).trim();
        }

        // 1. Handle OR (||) â€” lowest precedence
        int orIndex = findTopLevelOperator(expr, "||");
        if (orIndex >= 0) {
            String left = expr.substring(0, orIndex).trim();
            String right = expr.substring(orIndex + 2).trim();
            // Short-circuit: if left is true, return true
            return evaluateExpression(left, data) || evaluateExpression(right, data);
        }

        // 2. Handle AND (&&)
        int andIndex = findTopLevelOperator(expr, "&&");
        if (andIndex >= 0) {
            String left = expr.substring(0, andIndex).trim();
            String right = expr.substring(andIndex + 2).trim();
            // Short-circuit: if left is false, return false
            return evaluateExpression(left, data) && evaluateExpression(right, data);
        }

        // 3. Handle function calls: contains(), startsWith(), endsWith()
        Matcher funcMatcher = FUNCTION_PATTERN.matcher(expr);
        if (funcMatcher.matches()) {
            String funcName = funcMatcher.group(1);
            String fieldName = funcMatcher.group(2);
            String value = funcMatcher.group(3);
            return evaluateFunction(funcName, fieldName, value, data);
        }

        // 4. Handle comparison operators
        return evaluateComparison(expr, data);
    }

    private boolean evaluateComparison(String expr, Map<String, Object> data) {
        // Try operators in order of length (longest first to avoid partial matches)
        String[][] operators = {{"!=", "NE"}, {"==", "EQ"}, {"<=", "LE"}, {">=", "GE"}, {"<", "LT"}, {">", "GT"}};

        for (String[] op : operators) {
            int idx = findComparisonOperator(expr, op[0]);
            if (idx >= 0) {
                String left = expr.substring(0, idx).trim();
                String right = expr.substring(idx + op[0].length()).trim();
                Object leftVal = resolveValue(left, data);
                Object rightVal = resolveValue(right, data);
                return compare(leftVal, rightVal, op[0]);
            }
        }

        // If no operator found, treat as boolean field
        Object val = resolveValue(expr, data);
        if (val instanceof Boolean) {
            return (Boolean) val;
        }
        return val != null;
    }

    private int findComparisonOperator(String expr, String op) {
        boolean inQuote = false;
        int parenDepth = 0;

        for (int i = 0; i <= expr.length() - op.length(); i++) {
            char c = expr.charAt(i);
            if (c == '\'' || c == '"') inQuote = !inQuote;
            else if (c == '(' && !inQuote) parenDepth++;
            else if (c == ')' && !inQuote) parenDepth--;

            if (!inQuote && parenDepth == 0) {
                if (expr.startsWith(op, i)) {
                    // Avoid partial matches (e.g., '>' matching '>=')
                    if (op.length() == 1) {
                        if (i + 1 < expr.length() && expr.charAt(i + 1) == '=') continue;
                        if (i > 0 && (expr.charAt(i - 1) == '<' || expr.charAt(i - 1) == '>' || expr.charAt(i - 1) == '!')) continue;
                    }
                    return i;
                }
            }
        }
        return -1;
    }

    private Object resolveValue(String token, Map<String, Object> data) {
        token = token.trim();

        // String literals
        if ((token.startsWith("'") && token.endsWith("'")) ||
            (token.startsWith("\"") && token.endsWith("\""))) {
            return token.substring(1, token.length() - 1);
        }

        // Boolean literals
        if ("true".equalsIgnoreCase(token)) return true;
        if ("false".equalsIgnoreCase(token)) return false;

        // Null literal
        if ("null".equalsIgnoreCase(token)) return null;

        // Numeric literals
        try {
            if (token.contains(".")) return Double.parseDouble(token);
            return Long.parseLong(token);
        } catch (NumberFormatException ignored) {
            // Not a number â€” treat as field name
        }

        // Field reference â€” look up in data
        return data.get(token);
    }

    private boolean compare(Object left, Object right, String operator) {
        if (left == null && right == null) return "==".equals(operator);
        if (left == null || right == null) return "!=".equals(operator);

        // Try numeric comparison
        Double leftNum = toNumber(left);
        Double rightNum = toNumber(right);
        if (leftNum != null && rightNum != null) {
            return switch (operator) {
                case "==" -> leftNum.equals(rightNum);
                case "!=" -> !leftNum.equals(rightNum);
                case "<" -> leftNum < rightNum;
                case ">" -> leftNum > rightNum;
                case "<=" -> leftNum <= rightNum;
                case ">=" -> leftNum >= rightNum;
                default -> false;
            };
        }

        // String comparison
        String leftStr = String.valueOf(left);
        String rightStr = String.valueOf(right);
        return switch (operator) {
            case "==" -> leftStr.equals(rightStr);
            case "!=" -> !leftStr.equals(rightStr);
            case "<" -> leftStr.compareTo(rightStr) < 0;
            case ">" -> leftStr.compareTo(rightStr) > 0;
            case "<=" -> leftStr.compareTo(rightStr) <= 0;
            case ">=" -> leftStr.compareTo(rightStr) >= 0;
            default -> false;
        };
    }

    private Double toNumber(Object value) {
        if (value instanceof Number num) return num.doubleValue();
        if (value instanceof String str) {
            try {
                return Double.parseDouble(str);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private boolean evaluateFunction(String funcName, String fieldName, String value, Map<String, Object> data) {
        Object fieldValue = data.get(fieldName);
        if (fieldValue == null) return false;
        String fieldStr = String.valueOf(fieldValue);
        return switch (funcName) {
            case "contains" -> fieldStr.contains(value);
            case "startsWith" -> fieldStr.startsWith(value);
            case "endsWith" -> fieldStr.endsWith(value);
            default -> false;
        };
    }

    private int findTopLevelOperator(String expr, String op) {
        boolean inQuote = false;
        int parenDepth = 0;

        for (int i = 0; i <= expr.length() - op.length(); i++) {
            char c = expr.charAt(i);
            if (c == '\'' || c == '"') inQuote = !inQuote;
            else if (c == '(' && !inQuote) parenDepth++;
            else if (c == ')' && !inQuote) parenDepth--;

            if (!inQuote && parenDepth == 0 && expr.startsWith(op, i)) {
                return i;
            }
        }
        return -1;
    }

    private int findMatchingParen(String expr, int openIndex) {
        int depth = 0;
        boolean inQuote = false;
        for (int i = openIndex; i < expr.length(); i++) {
            char c = expr.charAt(i);
            if (c == '\'' || c == '"') inQuote = !inQuote;
            else if (c == '(' && !inQuote) depth++;
            else if (c == ')' && !inQuote) {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }
}

