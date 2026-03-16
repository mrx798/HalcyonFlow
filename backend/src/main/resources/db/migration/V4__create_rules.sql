-- Create rules table
CREATE TABLE rules (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id      UUID         NOT NULL REFERENCES steps (id) ON DELETE CASCADE,
    condition    VARCHAR(500) NOT NULL,
    next_step_id UUID         REFERENCES steps (id) ON DELETE SET NULL,
    priority     INTEGER      NOT NULL DEFAULT 0,
    is_default   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_rules_step_priority UNIQUE (step_id, priority)
);

-- Deferrable unique constraint: at most one default rule per step
-- Uses a partial unique index (only rows where is_default = true)
CREATE UNIQUE INDEX uq_rules_step_default
    ON rules (step_id)
    WHERE is_default = TRUE;

-- Indexes
CREATE INDEX idx_rules_step_id          ON rules (step_id);
CREATE INDEX idx_rules_step_id_priority ON rules (step_id, priority);
