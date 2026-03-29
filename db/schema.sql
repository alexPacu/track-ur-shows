-- track ur shows tables
-- PostgreSQL 16

-- drop existing tables (reverse order of creation to handle foreign keys)
DROP TABLE IF EXISTS ai_recommendations CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS list_items CASCADE;
DROP TABLE IF EXISTS user_lists CASCADE;
DROP TABLE IF EXISTS user_reviews CASCADE;
DROP TABLE IF EXISTS user_episodes CASCADE;
DROP TABLE IF EXISTS user_library CASCADE;
DROP TABLE IF EXISTS show_watch_providers CASCADE;
DROP TABLE IF EXISTS episodes CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS watch_providers CASCADE;
DROP TABLE IF EXISTS networks CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ++++
-- user management
-- ++++

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture_url VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE TABLE user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_shows_watched INTEGER DEFAULT 0,
  total_episodes_watched INTEGER DEFAULT 0,
  total_hours_watched DECIMAL(10,2) DEFAULT 0,
  average_rating DECIMAL(3,1) CHECK (average_rating >= 0 AND average_rating <= 10 OR average_rating IS NULL),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ++++
-- reference data (TMDB cached data)
-- ++++

CREATE TABLE genres (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE networks (
  id BIGSERIAL PRIMARY KEY,
  tmdb_network_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  logo_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE watch_providers (
  id BIGSERIAL PRIMARY KEY,
  tmdb_provider_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  logo_path VARCHAR(500),
  provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN ('flatrate', 'buy', 'rent')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_watch_providers_type ON watch_providers(provider_type);

-- ++++
-- shows and episodes (TMDB cached data)
-- ++++

CREATE TABLE shows (
  id BIGSERIAL PRIMARY KEY,
  tmdb_id BIGINT UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  genres JSONB,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10 OR rating IS NULL),
  release_date DATE,
  poster_path VARCHAR(500),
  backdrop_path VARCHAR(500),
  runtime INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shows_tmdb_id ON shows(tmdb_id);
CREATE INDEX idx_shows_media_type ON shows(media_type);
CREATE INDEX idx_shows_created_at ON shows(created_at);

CREATE TABLE seasons (
  id BIGSERIAL PRIMARY KEY,
  show_id BIGINT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  air_date DATE,
  episode_count INTEGER,
  poster_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(show_id, season_number)
);

CREATE INDEX idx_seasons_show_id ON seasons(show_id);

CREATE TABLE episodes (
  id BIGSERIAL PRIMARY KEY,
  season_id BIGINT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  show_id BIGINT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  name VARCHAR(500) NOT NULL,
  air_date DATE,
  runtime INTEGER,
  still_path VARCHAR(500),
  overview TEXT,
  vote_average DECIMAL(3,1) CHECK (vote_average >= 0 AND vote_average <= 10 OR vote_average IS NULL),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(season_id, episode_number)
);

CREATE INDEX idx_episodes_show_id ON episodes(show_id);
CREATE INDEX idx_episodes_air_date ON episodes(air_date);

-- ++++
-- providers
-- ++++

CREATE TABLE show_watch_providers (
  id BIGSERIAL PRIMARY KEY,
  show_id BIGINT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  provider_id BIGINT NOT NULL REFERENCES watch_providers(id) ON DELETE CASCADE,
  region VARCHAR(10) NOT NULL,
  provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN ('flatrate', 'buy', 'rent')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(show_id, provider_id, region, provider_type)
);

CREATE INDEX idx_show_watch_providers_show_id ON show_watch_providers(show_id);
CREATE INDEX idx_show_watch_providers_region ON show_watch_providers(region);

-- ++++
-- user library and episode tracking
-- ++++

CREATE TABLE user_library (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_id BIGINT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('watching', 'completed', 'dropped', 'paused', 'planning_to_watch')),
  personal_rating DECIMAL(3,1) CHECK (personal_rating >= 0 AND personal_rating <= 10 OR personal_rating IS NULL),
  is_favorite BOOLEAN DEFAULT FALSE,
  current_season INTEGER,
  current_episode INTEGER,
  date_started DATE,
  date_completed DATE,
  hours_watched DECIMAL(10,2) DEFAULT 0,
  times_rewatched INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, show_id)
);

CREATE INDEX idx_user_library_user_id_status ON user_library(user_id, status);
CREATE INDEX idx_user_library_user_id_created ON user_library(user_id, created_at);

CREATE TABLE user_episodes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  episode_id BIGINT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  watched_date DATE NOT NULL,
  personal_rating DECIMAL(3,1) CHECK (personal_rating >= 0 AND personal_rating <= 10 OR personal_rating IS NULL),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, episode_id)
);

CREATE INDEX idx_user_episodes_user_id_watched ON user_episodes(user_id, watched_date);

CREATE TABLE user_reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_id BIGINT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  spoiler_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX idx_user_reviews_show_id ON user_reviews(show_id);

-- ++++
-- custom lists and watchlists
-- ++++

CREATE TABLE user_lists (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_lists_user_id ON user_lists(user_id);

CREATE TABLE list_items (
  id BIGSERIAL PRIMARY KEY,
  list_id BIGINT NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  show_id BIGINT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(list_id, show_id)
);

CREATE INDEX idx_list_items_list_id_position ON list_items(list_id, position);

-- ++++
-- ai chatbot and recoms
-- ++++

CREATE TABLE chat_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id, created_at);

CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id, created_at);

CREATE TABLE user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  favorite_genres JSONB,
  favorite_networks JSONB,
  mood_preferences JSONB,
  preferred_languages JSONB,
  watch_time_preference VARCHAR(20) CHECK (watch_time_preference IN ('morning', 'evening', 'anytime') OR watch_time_preference IS NULL),
  min_rating_threshold DECIMAL(3,1) CHECK (min_rating_threshold >= 0 AND min_rating_threshold <= 10 OR min_rating_threshold IS NULL),
  max_runtime_preference INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_recommendations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id BIGINT REFERENCES chat_conversations(id) ON DELETE SET NULL,
  recommended_show_id BIGINT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(30) NOT NULL CHECK (recommendation_type IN ('simple', 'conversational', 'discussion', 'mood-based')),
  user_feedback VARCHAR(20) CHECK (user_feedback IN ('liked', 'disliked', 'neutral') OR user_feedback IS NULL),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_recommendations_user_id ON ai_recommendations(user_id, created_at);
CREATE INDEX idx_ai_recommendations_show_id ON ai_recommendations(recommended_show_id);
