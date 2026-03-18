package com.flowforge.backend.engine;

import com.flowforge.backend.constants.AppConstants;
import com.flowforge.backend.dto.*;
import com.flowforge.backend.dto.request.*;
import com.flowforge.backend.dto.response.*;
import com.flowforge.backend.entity.*;
import com.flowforge.backend.enums.*;
import com.flowforge.backend.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

import com.flowforge.backend.constants.AppConstants;

/**
 * Executes individual workflow steps based on their defined step type.
 *
 * <p>Step Type Handlers:</p>
 *<ul>
 *  <li><b>TASK:</b> Automated system action. Executes instantly and completes without human intervention.</li>
 *  <li><b>APPROVAL:</b> Human-in-the-loop action. Pauses execution, generates an approval request, and notifies the assignee or workflow owner.</li>
 *  <li><b>NOTIFICATION:</b> Alert action. Sends an asynchronous notification to the specified recipient and immediately completes the step.</li>
 *</ul>
 *
 * @author Sharath
 * @version 1.0
 * @since 2026
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StepExecutor {

    private final NotificationService notificationService;

    /**
     * Executes a step and returns the result.
     */
    public StepExecutionResult execute(Step step, Execution execution, Map<String, Object> inputData) {
        StepType stepType = step.getStepType();
        log.info("Executing step '{}' (type={}) for execution {}", step.getName(), stepType, execution.getId());

        return switch (stepType) {
            case TASK -> executeTask(step, execution, inputData);
            case APPROVAL -> executeApproval(step, execution);
            case NOTIFICATION -> executeNotification(step, execution);
        };
    }

    private StepExecutionResult executeTask(Step step, Execution execution, Map<String, Object> inputData) {
        log.info("Task step '{}' executed successfully", step.getName());
        return new StepExecutionResult(AppConstants.STATUS_COMPLETED, "Task '" + step.getName() + "' completed successfully", false, null);
    }

    private StepExecutionResult executeApproval(Step step, Execution execution) {
        Map<String, Object> metadata = step.getMetadata();
        String assigneeEmail = metadata != null ? (String) metadata.get("assignee_email") : null;

        if (assigneeEmail != null) {
            notificationService.sendApprovalNotification(execution, step, assigneeEmail);
            log.info("Approval notification sent to '{}' for step '{}'", assigneeEmail, step.getName());
        } else {
            // Notify the workflow owner if no assignee specified
            notificationService.createNotification(
                    execution.getTriggeredBy().getId(),
                    execution.getId(),
                    NotificationType.APPROVAL_REQUIRED,
                    "Approval Required: " + step.getName(),
                    "Step '" + step.getName() + "' in workflow '" + execution.getWorkflow().getName() + "' requires your approval."
            );
            log.info("Approval notification sent to workflow owner for step '{}'", step.getName());
        }

        return new StepExecutionResult(AppConstants.STATUS_WAITING, "Waiting for approval on step '" + step.getName() + "'", true, assigneeEmail);
    }

    private StepExecutionResult executeNotification(Step step, Execution execution) {
        Map<String, Object> metadata = step.getMetadata();
        String title = metadata != null && metadata.get("title") != null
                ? (String) metadata.get("title")
                : "Step Completed: " + step.getName();
        String message = metadata != null && metadata.get("message") != null
                ? (String) metadata.get("message")
                : "Notification step '" + step.getName() + "' in workflow '" + execution.getWorkflow().getName() + "' has been executed.";

        notificationService.createNotification(
                execution.getTriggeredBy().getId(),
                execution.getId(),
                NotificationType.STEP_COMPLETED,
                title,
                message
        );

        log.info("Notification step '{}' executed successfully", step.getName());
        return new StepExecutionResult(AppConstants.STATUS_COMPLETED, "Notification sent for step '" + step.getName() + "'", false, null);
    }

    /**
     * Result of executing a single step.
     */
    public record StepExecutionResult(
            String status,
            String message,
            boolean requiresApproval,
            String assigneeEmail
    ) {}
}

