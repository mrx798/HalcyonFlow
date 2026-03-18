package com.flowforge.backend.mapper;

import com.flowforge.backend.dto.request.WorkflowRequest;
import com.flowforge.backend.dto.response.WorkflowResponse;
import com.flowforge.backend.entity.Workflow;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WorkflowMapper {

    Workflow toEntity(WorkflowRequest request);

    WorkflowResponse toResponse(Workflow entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "startStepId", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "steps", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(WorkflowRequest request, @MappingTarget Workflow entity);
}

