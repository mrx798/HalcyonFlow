package com.flowforge.backend.dto.request;

import com.flowforge.backend.enums.StepType;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStepRequest {

    @Size(min = 2, max = 200, message = "Step name must be between 2 and 200 characters")
    private String name;

    private StepType stepType;

    private Map<String, Object> metadata;
}

