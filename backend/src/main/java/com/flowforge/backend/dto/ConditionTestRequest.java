package com.flowforge.backend.dto;

import lombok.Data;
import java.util.Map;

@Data
public class ConditionTestRequest {
    private String condition;
    private Map<String, Object> testData;
}
