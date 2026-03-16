-- Create execution_status enum type
CREATE TYPE execution_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Create executions table
CREATE TABLE executions (
    id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id      UUID             NOT NULL REFERENCES workflows (id) ON DELETE RESTRICT,
    workflow_version INTEGER          NOT NULL,
    status           execution_status NOT NULL DEFAULT 'PENDING',
    input_data       JSONB,
    logs             JSONB            NOT NULL DEFAULT '[]'::jsonb,
    current_step_id  UUID             REFERENCES steps (id) ON DELETE SET NULL,
    retries          INTEGER          NOT NULL DEFAULT 0,
    error_message    TEXT,
    triggered_by     UUID             NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    started_at       TIMESTAMP,
    ended_at         TIMESTAMP,
    created_at       TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_executions_workflow_id  ON executions (workflow_id);
CREATE INDEX idx_executions_status       ON executions (status);
CREATE INDEX idx_executions_triggered_by ON executions (triggered_by);
CREATE INDEX idx_executions_created_at   ON executions (created_at DESC);
