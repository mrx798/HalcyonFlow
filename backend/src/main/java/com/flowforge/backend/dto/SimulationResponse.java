package com.flowforge.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class SimulationResponse {
    private String workflowId;
    private String workflowName;
    private boolean simulatedSuccess;
    private String simulationError;
    private List<SimulationStep> path;

    @Data
    public static class SimulationStep {
        private String stepId;
        private String stepName;
        private String stepType;
        private boolean rulesEvaluated;
        private String matchedRuleCondition;
        private String error;
        private int sequenceIndex;
    }
}
