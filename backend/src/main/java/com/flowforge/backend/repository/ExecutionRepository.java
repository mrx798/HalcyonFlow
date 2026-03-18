package com.flowforge.backend.repository;

import com.flowforge.backend.entity.Execution;
import com.flowforge.backend.enums.ExecutionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, UUID> {

    List<Execution> findByTriggeredByIdOrderByCreatedAtDesc(UUID userId);

    List<Execution> findByWorkflowIdOrderByCreatedAtDesc(UUID workflowId);

    List<Execution> findByStatusOrderByCreatedAtDesc(ExecutionStatus status);

    Page<Execution> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(ExecutionStatus status);

    long countByWorkflowIdAndStatus(UUID workflowId, ExecutionStatus status);

    List<Execution> findByWorkflowIdAndStatusIn(UUID workflowId, List<ExecutionStatus> statuses);

    long countByTriggeredById(UUID userId);

    long countByTriggeredByIdAndStatus(UUID userId, ExecutionStatus status);

    long countByTriggeredByIdAndStatusIn(UUID userId, List<ExecutionStatus> statuses);

    List<Execution> findTop5ByTriggeredByIdOrderByCreatedAtDesc(UUID userId);

    Page<Execution> findByTriggeredByIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}

