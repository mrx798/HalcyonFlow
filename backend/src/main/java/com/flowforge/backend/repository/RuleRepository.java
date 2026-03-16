package com.flowforge.backend.repository;

import com.flowforge.backend.entity.Rule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RuleRepository extends JpaRepository<Rule, UUID> {

    List<Rule> findByStepIdOrderByPriorityAsc(UUID stepId);

    @Query("SELECT MAX(r.priority) FROM Rule r WHERE r.step.id = :stepId")
    Integer findMaxPriorityByStepId(@Param("stepId") UUID stepId);

    Optional<Rule> findByIdAndStepId(UUID ruleId, UUID stepId);

    boolean existsByStepIdAndPriority(UUID stepId, Integer priority);

    boolean existsByStepIdAndIsDefaultTrue(UUID stepId);

    Optional<Rule> findByStepIdAndIsDefaultTrue(UUID stepId);

    Integer countByStepId(UUID stepId);
}
