-- Create workflow_status enum type
CREATE TYPE workflow_status AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- Create workflows table
CREATE TABLE workflows (
    id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(200)    NOT NULL,
    description   TEXT,
    version       INTEGER         NOT NULL DEFAULT 1,
    status        workflow_status NOT NULL DEFAULT 'DRAFT',
    is_active     BOOLEAN         NOT NULL DEFAULT FALSE,
    input_schema  JSONB           NOT NULL DEFAULT '{}'::jsonb,
    start_step_id UUID,
    created_by    UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at    TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflows_created_by ON workflows (created_by);
CREATE INDEX idx_workflows_status     ON workflows (status);
CREATE INDEX idx_workflows_name       ON workflows (name);
