package com.flowforge.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ConditionTestResponse {
    private String condition;
    private boolean result;
    private List<ExplanationStep> explanation;
    private Map<String, Object> testData;

    @Data
    public static class ExplanationStep {
        private String expression;
        private String value;
        private boolean result;

        public ExplanationStep(String expression, String value, boolean result) {
            this.expression = expression;
            this.value = value;
            this.result = result;
        }

        public ExplanationStep(String expression, boolean result) {
            this.expression = expression;
            this.value = null;
            this.result = result;
        }
    }
}
