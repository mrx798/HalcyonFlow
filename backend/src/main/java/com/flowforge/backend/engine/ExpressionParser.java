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
            log.warn("Failed to evaluate condition '{}': {}", condition, e.getMessage());
            return false;
        }
    }

    private boolean evaluateExpression(String expr, Map<String, Object> data) {
        expr = expr.trim();

        // Remove outermost matching parentheses
        while (expr.startsWith("(") && findMatchingParen(expr, 0) == expr.length() - 1) {
            expr = expr.substring(1, expr.length() - 1).trim();
        }

        // Handle OR (||) — lowest precedence, split at top-level only
        int orIndex = findTopLevelOperator(expr, "||");
        if (orIndex >= 0) {
            String left = expr.substring(0, orIndex).trim();
            String right = expr.substring(orIndex + 2).trim();
            return evaluateExpression(left, data) || evaluateExpression(right, data);
        }

        // Handle AND (&&)
        int andIndex = findTopLevelOperator(expr, "&&");
        if (andIndex >= 0) {
            String left = expr.substring(0, andIndex).trim();
            String right = expr.substring(andIndex + 2).trim();
            return evaluateExpression(left, data) && evaluateExpression(right, data);
        }

        // Handle function calls: contains(), startsWith(), endsWith()
        Matcher funcMatcher = FUNCTION_PATTERN.matcher(expr);
        if (funcMatcher.matches()) {
            String funcName = funcMatcher.group(1);
            String fieldName = funcMatcher.group(2);
            String value = funcMatcher.group(3);
            return evaluateFunction(funcName, fieldName, value, data);
        }

        // Handle comparison operators
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
        // Find operator that's not inside quotes
        boolean inSingleQuote = false;
        boolean inDoubleQuote = false;
        int parenDepth = 0;

        for (int i = 0; i <= expr.length() - op.length(); i++) {
            char c = expr.charAt(i);
            if (c == '\'' && !inDoubleQuote) inSingleQuote = !inSingleQuote;
            else if (c == '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
            else if (c == '(' && !inSingleQuote && !inDoubleQuote) parenDepth++;
            else if (c == ')' && !inSingleQuote && !inDoubleQuote) parenDepth--;

            if (!inSingleQuote && !inDoubleQuote && parenDepth == 0) {
                if (expr.startsWith(op, i)) {
                    // For < and >, make sure it's not part of <= or >= or !=
                    if (op.length() == 1) {
                        if (i + 1 < expr.length() && expr.charAt(i + 1) == '=') continue;
                        if (op.equals("<") && i > 0 && expr.charAt(i - 1) == '<') continue;
                        if (op.equals(">") && i > 0 && expr.charAt(i - 1) == '>') continue;
                        if (i > 0 && expr.charAt(i - 1) == '!') continue;
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
            // Not a number — treat as field name
        }

        // Field reference — look up in data
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
        boolean inSingleQuote = false;
        boolean inDoubleQuote = false;
        int parenDepth = 0;

        for (int i = 0; i <= expr.length() - op.length(); i++) {
            char c = expr.charAt(i);
            if (c == '\'' && !inDoubleQuote) inSingleQuote = !inSingleQuote;
            else if (c == '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
            else if (c == '(' && !inSingleQuote && !inDoubleQuote) parenDepth++;
            else if (c == ')' && !inSingleQuote && !inDoubleQuote) parenDepth--;

            if (!inSingleQuote && !inDoubleQuote && parenDepth == 0 && expr.startsWith(op, i)) {
                return i;
            }
        }
        return -1;
    }

    private int findMatchingParen(String expr, int openIndex) {
        int depth = 0;
        boolean inSingleQuote = false;
        boolean inDoubleQuote = false;
        for (int i = openIndex; i < expr.length(); i++) {
            char c = expr.charAt(i);
            if (c == '\'' && !inDoubleQuote) inSingleQuote = !inSingleQuote;
            else if (c == '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
            else if (c == '(' && !inSingleQuote && !inDoubleQuote) depth++;
            else if (c == ')' && !inSingleQuote && !inDoubleQuote) {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }
}
