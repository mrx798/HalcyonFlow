package com.flowforge.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecuteWorkflowRequest {

    @NotNull(message = "Workflow ID is required")
    private UUID workflowId;

    @NotNull(message = "Input data is required")
    private Map<String, Object> inputData;
}
