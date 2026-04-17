-- additive migration: profile picture and background image columns
-- safe to run on an existing DB without dropping other tables

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS background_image_url TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'profile_picture_url'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE users ALTER COLUMN profile_picture_url TYPE TEXT;
  END IF;
END $$;

ALTER TABLE user_library
  ADD COLUMN IF NOT EXISTS personal_rating DECIMAL(3,1)
    CHECK (personal_rating >= 0 AND personal_rating <= 10 OR personal_rating IS NULL);
