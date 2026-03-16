package com.flowforge.backend.dto.response;

import com.flowforge.backend.enums.ExecutionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecutionResponse {

    private UUID id;
    private UUID workflowId;
    private String workflowName;
    private Integer workflowVersion;
    private ExecutionStatus status;
    private Map<String, Object> inputData;
    private List<Map<String, Object>> logs;
    private UUID currentStepId;
    private String currentStepName;
    private Integer retries;
    private String errorMessage;
    private UUID triggeredById;
    private String triggeredByName;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;
    private String duration;
}
