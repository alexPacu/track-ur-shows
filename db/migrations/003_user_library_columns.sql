-- additive migration: user_library tracking columns
-- safe to run on an existing DB

ALTER TABLE user_library ADD COLUMN IF NOT EXISTS date_started DATE;
ALTER TABLE user_library ADD COLUMN IF NOT EXISTS date_completed DATE;
ALTER TABLE user_library ADD COLUMN IF NOT EXISTS hours_watched DECIMAL(10,2) DEFAULT 0;
ALTER TABLE user_library ADD COLUMN IF NOT EXISTS times_rewatched INTEGER DEFAULT 0;
ALTER TABLE user_library ADD COLUMN IF NOT EXISTS notes TEXT;
