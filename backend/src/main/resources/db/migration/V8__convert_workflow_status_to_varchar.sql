-- Convert workflow_status enum to VARCHAR
ALTER TABLE workflows ALTER COLUMN status TYPE VARCHAR(20) USING status::text;
ALTER TABLE workflows ALTER COLUMN status SET DEFAULT 'DRAFT';
DROP TYPE IF EXISTS workflow_status;
