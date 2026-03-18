package com.flowforge.backend.repository;

import com.flowforge.backend.entity.Step;
import com.flowforge.backend.enums.StepType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StepRepository extends JpaRepository<Step, UUID> {

    List<Step> findByWorkflowIdOrderByStepOrderAsc(UUID workflowId);

    Optional<Step> findByIdAndWorkflowId(UUID stepId, UUID workflowId);

    boolean existsByWorkflowIdAndStepOrder(UUID workflowId, Integer stepOrder);

    @Query("SELECT COALESCE(MAX(s.stepOrder), 0) FROM Step s WHERE s.workflow.id = :workflowId")
    Integer findMaxStepOrderByWorkflowId(@Param("workflowId") UUID workflowId);

    @Query("SELECT s FROM Step s WHERE s.workflow.id = :workflowId AND s.stepType = :stepType ORDER BY s.stepOrder ASC")
    List<Step> findByWorkflowIdAndStepType(@Param("workflowId") UUID workflowId, @Param("stepType") StepType stepType);
}

