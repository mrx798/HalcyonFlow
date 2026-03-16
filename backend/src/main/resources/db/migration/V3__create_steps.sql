-- Create step_type enum type
CREATE TYPE step_type AS ENUM ('TASK', 'APPROVAL', 'NOTIFICATION');

-- Create steps table
CREATE TABLE steps (
    id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID      NOT NULL REFERENCES workflows (id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    step_type   step_type NOT NULL,
    step_order  INTEGER   NOT NULL DEFAULT 0,
    metadata    JSONB     NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_steps_workflow_order UNIQUE (workflow_id, step_order)
);

-- Indexes
CREATE INDEX idx_steps_workflow_id ON steps (workflow_id);
CREATE INDEX idx_steps_step_type   ON steps (step_type);

-- Add FK from workflows.start_step_id → steps.id
ALTER TABLE workflows
    ADD CONSTRAINT fk_workflows_start_step
    FOREIGN KEY (start_step_id) REFERENCES steps (id) ON DELETE SET NULL;
