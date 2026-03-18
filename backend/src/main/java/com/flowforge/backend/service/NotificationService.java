package com.flowforge.backend.service;

import com.flowforge.backend.dto.*;
import com.flowforge.backend.dto.request.*;
import com.flowforge.backend.dto.response.*;
import com.flowforge.backend.entity.*;
import com.flowforge.backend.enums.*;
import com.flowforge.backend.exception.*;
import com.flowforge.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service responsible for asynchronous system notifications.
 * Generates and manages alerts for step approvals, workflow completions,
 * and execution failures, delivering them to the appropriate users.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(UUID userId, UUID executionId, NotificationType type,
                                   String title, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId.toString()));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .isRead(false)
                .build();

        // Set execution if provided
        if (executionId != null) {
            notification.setExecution(com.flowforge.backend.entity.Execution.builder().id(executionId).build());
        }

        notificationRepository.save(notification);
        log.info("Notification created for user {} â€” type: {}, title: '{}'", userId, type, title);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId.toString()));

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Notification does not belong to the current user");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void sendApprovalNotification(Execution execution, Step step, String assigneeEmail) {
        User assignee = userRepository.findByEmail(assigneeEmail).orElse(null);
        UUID targetUserId = assignee != null ? assignee.getId() : execution.getTriggeredBy().getId();

        String title = "Approval Required: " + step.getName();
        String message = String.format(
                "Step '%s' in workflow '%s' (Execution: %s) requires your approval.",
                step.getName(),
                execution.getWorkflow().getName(),
                execution.getId()
        );

        createNotification(targetUserId, execution.getId(), NotificationType.APPROVAL_REQUIRED, title, message);
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .executionId(notification.getExecution() != null ? notification.getExecution().getId() : null)
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

