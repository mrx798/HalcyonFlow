-- Convert user_role enum to VARCHAR
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20) USING role::text;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'USER';
DROP TYPE IF EXISTS user_role;

-- Convert step_type enum to VARCHAR
ALTER TABLE steps ALTER COLUMN step_type TYPE VARCHAR(20) USING step_type::text;
DROP TYPE IF EXISTS step_type;

-- Convert execution_status enum to VARCHAR
ALTER TABLE executions ALTER COLUMN status TYPE VARCHAR(20) USING status::text;
ALTER TABLE executions ALTER COLUMN status SET DEFAULT 'PENDING';
DROP TYPE IF EXISTS execution_status;

-- Convert notification_type enum to VARCHAR
ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR(30) USING type::text;
DROP TYPE IF EXISTS notification_type;
