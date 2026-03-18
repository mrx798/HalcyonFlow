package com.flowforge.backend.dto.response;

import com.flowforge.backend.enums.WorkflowStatus;
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
public class WorkflowResponse {

    private UUID id;
    private String name;
    private String description;
    private Integer version;
    private WorkflowStatus status;
    private Boolean isActive;
    private Map<String, Object> inputSchema;
    private UUID startStepId;
    private UserResponse createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

