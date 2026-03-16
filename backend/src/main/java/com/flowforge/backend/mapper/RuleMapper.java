package com.flowforge.backend.mapper;

import com.flowforge.backend.dto.request.CreateRuleRequest;
import com.flowforge.backend.dto.request.UpdateRuleRequest;
import com.flowforge.backend.dto.response.RuleResponse;
import com.flowforge.backend.entity.Rule;
import com.flowforge.backend.entity.Step;
import com.flowforge.backend.repository.StepRepository;
import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Optional;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public abstract class RuleMapper {

    @Autowired
    protected StepRepository stepRepository;

    @Mapping(target = "stepId", source = "step.id")
    @Mapping(target = "nextStepName", ignore = true)
    public abstract RuleResponse toResponse(Rule rule);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "step", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    public abstract Rule toEntity(CreateRuleRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "step", ignore = true)
    @Mapping(target = "isDefault", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    public abstract void updateEntity(UpdateRuleRequest request, @MappingTarget Rule rule);

    @AfterMapping
    protected void resolveNextStepName(@MappingTarget RuleResponse response, Rule rule) {
        if (rule.getNextStepId() != null) {
            Optional<Step> nextStep = stepRepository.findById(rule.getNextStepId());
            nextStep.ifPresent(step -> response.setNextStepName(step.getName()));
        }
    }
}
