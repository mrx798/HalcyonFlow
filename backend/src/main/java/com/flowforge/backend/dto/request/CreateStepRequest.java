package com.flowforge.backend.dto.request;

import com.flowforge.backend.enums.StepType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateStepRequest {

    // workflowId is set from the path variable by the controller, not from the JSON body
    private UUID workflowId;

    @NotBlank(message = "Step name is required")
    @Size(min = 2, max = 200, message = "Step name must be between 2 and 200 characters")
    private String name;

    @NotNull(message = "Step type is required")
    private StepType stepType;

    private Integer stepOrder;

    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();
}

