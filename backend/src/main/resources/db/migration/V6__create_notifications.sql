-- Create notification_type enum type
CREATE TYPE notification_type AS ENUM (
    'EXECUTION_STARTED',
    'EXECUTION_COMPLETED',
    'EXECUTION_FAILED',
    'APPROVAL_REQUIRED',
    'STEP_COMPLETED'
);

-- Create notifications table
CREATE TABLE notifications (
    id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID              NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    execution_id UUID              REFERENCES executions (id) ON DELETE CASCADE,
    type         notification_type NOT NULL,
    title        VARCHAR(255)      NOT NULL,
    message      TEXT,
    is_read      BOOLEAN           NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP         NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id      ON notifications (user_id);
CREATE INDEX idx_notifications_user_read    ON notifications (user_id, is_read);
CREATE INDEX idx_notifications_created_at   ON notifications (created_at DESC);
