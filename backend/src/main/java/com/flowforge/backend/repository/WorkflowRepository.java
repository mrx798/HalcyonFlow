package com.flowforge.backend.repository;

import com.flowforge.backend.entity.Workflow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {
    long countByCreatedById(UUID userId);
    
    List<Workflow> findAllByCreatedByIdOrderByCreatedAtDesc(UUID userId);
    
    Page<Workflow> findAllByCreatedByIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    
    Page<Workflow> findAllByCreatedByIdAndNameContainingIgnoreCaseOrderByCreatedAtDesc(UUID userId, String search, Pageable pageable);
    
    Optional<Workflow> findByIdAndCreatedById(UUID id, UUID userId);
    
    boolean existsByIdAndCreatedById(UUID id, UUID userId);
}

