package com.flowforge.backend.dto.response;

import com.flowforge.backend.enums.StepType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StepResponse {

    private UUID id;
    private UUID workflowId;
    private String name;
    private StepType stepType;
    private Integer stepOrder;
    private Map<String, Object> metadata;
    private Integer ruleCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
