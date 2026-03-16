package com.flowforge.backend.mapper;

import com.flowforge.backend.dto.request.CreateStepRequest;
import com.flowforge.backend.dto.request.UpdateStepRequest;
import com.flowforge.backend.dto.response.StepDetailResponse;
import com.flowforge.backend.dto.response.StepResponse;
import com.flowforge.backend.entity.Step;
import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", uses = {RuleMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StepMapper {

    @Mapping(target = "workflowId", source = "workflow.id")
    @Mapping(target = "ruleCount", ignore = true)
    StepResponse toResponse(Step step);

    @Mapping(target = "workflowId", source = "workflow.id")
    @Mapping(target = "ruleCount", ignore = true)
    @Mapping(target = "rules", source = "rules")
    StepDetailResponse toDetailResponse(Step step);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "workflow", ignore = true)
    @Mapping(target = "rules", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Step toEntity(CreateStepRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "workflow", ignore = true)
    @Mapping(target = "stepOrder", ignore = true)
    @Mapping(target = "rules", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UpdateStepRequest request, @MappingTarget Step step);

    @AfterMapping
    default void setRuleCount(@MappingTarget StepResponse response, Step step) {
        response.setRuleCount(step.getRules() != null ? step.getRules().size() : 0);
    }

    @AfterMapping
    default void setDetailRuleCount(@MappingTarget StepDetailResponse response, Step step) {
        response.setRuleCount(step.getRules() != null ? step.getRules().size() : 0);
    }
}

