package com.flowforge.backend.mapper;

import com.flowforge.backend.dto.response.UserResponse;
import com.flowforge.backend.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {
    UserResponse toResponse(User entity);
}
