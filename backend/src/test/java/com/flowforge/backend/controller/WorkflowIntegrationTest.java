package com.flowforge.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowforge.backend.dto.request.LoginRequest;
import com.flowforge.backend.dto.request.RegisterRequest;
import com.flowforge.backend.dto.request.WorkflowRequest;
import com.flowforge.backend.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@SuppressWarnings("null")
class WorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String userEmail;
    private String userPassword;

    @BeforeEach
    void setUp() {
        userEmail = "testuser" + System.currentTimeMillis() + "@HalcyonFlow.com";
        userPassword = "Password123!";
    }

    private String getAuthToken() throws Exception {
        // Register
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setName("Test User");
        registerReq.setEmail(userEmail);
        registerReq.setPassword(userPassword);
        registerReq.setRole(UserRole.USER);

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Login
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail(userEmail);
        loginReq.setPassword(userPassword);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andReturn();

        String responseString = result.getResponse().getContentAsString();
        return com.jayway.jsonpath.JsonPath.read(responseString, "$.data.accessToken");
    }

    @Test
    void testRegisterLoginCreateWorkflow_FullFlow() throws Exception {
        String token = getAuthToken();

        WorkflowRequest workflowReq = new WorkflowRequest();
        workflowReq.setName("Employee Onboarding");
        workflowReq.setDescription("Handles new employee setup");
        workflowReq.setInputSchema(Map.of("department", "string", "role", "string"));

        // Create Workflow
        mockMvc.perform(post("/api/v1/workflows")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(workflowReq)))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.name").value("Employee Onboarding"))
                .andExpect(jsonPath("$.data.description").value("Handles new employee setup"));
                
        // Get Workflows to verify
        mockMvc.perform(get("/api/v1/workflows")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].name").value("Employee Onboarding"));
    }

    @Test
    void testUnauthorizedAccess_Returns401() throws Exception {
        WorkflowRequest workflowReq = new WorkflowRequest();
        workflowReq.setName("Unauthorized Workflow");
        workflowReq.setInputSchema(Map.of());

        // Attempt creation without token
        mockMvc.perform(post("/api/v1/workflows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(workflowReq)))
                .andExpect(status().isForbidden());
                
        // Attempt getting without token
        mockMvc.perform(get("/api/v1/workflows"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCreateWorkflowWithInvalidData_Returns400() throws Exception {
        String token = getAuthToken();

        // Missing required fields 'name' and 'inputSchema'
        WorkflowRequest invalidReq = new WorkflowRequest();
        invalidReq.setDescription("This is missing required data");

        mockMvc.perform(post("/api/v1/workflows")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.errors").isMap()) // Validation errors
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.inputSchema").exists());
    }
}

