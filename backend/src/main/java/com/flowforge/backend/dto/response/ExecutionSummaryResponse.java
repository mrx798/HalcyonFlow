package com.flowforge.backend.dto.response;

import com.flowforge.backend.enums.ExecutionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecutionSummaryResponse {

    private UUID id;
    private UUID workflowId;
    private String workflowName;
    private ExecutionStatus status;
    private String triggeredByName;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private String duration;
    private LocalDateTime createdAt;
}
