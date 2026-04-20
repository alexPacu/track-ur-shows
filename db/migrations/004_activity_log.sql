CREATE TABLE IF NOT EXISTS activity_log (
  id        BIGSERIAL PRIMARY KEY,
  user_id   BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id   BIGINT      NOT NULL,
  action    VARCHAR(50) NOT NULL,
  created_at TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created
  ON activity_log(user_id, created_at);
