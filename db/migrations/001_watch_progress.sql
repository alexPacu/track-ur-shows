-- additive migration: continue watching
-- safe to run on an existing DB without dropping other tables

CREATE TABLE IF NOT EXISTS watch_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id BIGINT NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  season INTEGER NOT NULL DEFAULT 0,
  episode INTEGER NOT NULL DEFAULT 0,
  progress_seconds INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  progress_percent DECIMAL(5,2) DEFAULT 0,
  title VARCHAR(500),
  poster_path VARCHAR(500),
  backdrop_path VARCHAR(500),
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tmdb_id, media_type, season, episode)
);

CREATE INDEX IF NOT EXISTS idx_watch_progress_user_last
  ON watch_progress(user_id, last_watched_at DESC);
