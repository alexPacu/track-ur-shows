-- Convert activity_log.created_at from TIMESTAMP to TIMESTAMPTZ.

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'activity_log' AND column_name = 'created_at') = 'timestamp without time zone' THEN
    ALTER TABLE activity_log
      ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
  END IF;
END $$;
