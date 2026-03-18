package com.flowforge.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRuleRequest {

    @NotBlank(message = "A valid rule condition (e.g., 'amount > 100' or 'DEFAULT') must be provided")
    @Size(max = 500, message = "Condition must not exceed 500 characters")
    private String condition;

    private UUID nextStepId;

    private Integer priority;

    @Builder.Default
    private Boolean isDefault = false;
}

