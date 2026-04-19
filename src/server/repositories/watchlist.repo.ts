import { queryOne, queryMany, query } from '@/lib/db';

let _libraryColumnsEnsured = false;
async function ensureLibraryColumns() {
  if (_libraryColumnsEnsured) return;
  await query(`ALTER TABLE user_library ADD COLUMN IF NOT EXISTS date_started DATE`);
  await query(`ALTER TABLE user_library ADD COLUMN IF NOT EXISTS date_completed DATE`);
  await query(`ALTER TABLE user_library ADD COLUMN IF NOT EXISTS hours_watched DECIMAL(10,2) DEFAULT 0`);
  await query(`ALTER TABLE user_library ADD COLUMN IF NOT EXISTS times_rewatched INTEGER DEFAULT 0`);
  await query(`ALTER TABLE user_library ADD COLUMN IF NOT EXISTS notes TEXT`);
  _libraryColumnsEnsured = true;
}

export interface UserLibraryEntry {
  id: number;
  user_id: number;
  show_id: number;
  status: string;
  personal_rating?: number;
  is_favorite: boolean;
  current_season?: number;
  current_episode?: number;
  date_started?: Date;
  date_completed?: Date;
  hours_watched: number;
  times_rewatched: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserLibraryWithShow extends UserLibraryEntry {
  tmdb_id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path?: string;
  backdrop_path?: string;
  rating?: number;
  genres?: number[] | null;
}

export class WatchlistRepository {
  static async getByUser(userId: number): Promise<UserLibraryWithShow[]> {
    return queryMany<UserLibraryWithShow>(
      `SELECT ul.*, s.tmdb_id, s.title, s.media_type, s.poster_path, s.backdrop_path, s.rating, s.genres
       FROM user_library ul
       JOIN shows s ON s.id = ul.show_id
       WHERE ul.user_id = $1
       ORDER BY ul.updated_at DESC`,
      [userId]
    );
  }

  static async findByUserAndTmdbId(userId: number, tmdbId: number): Promise<UserLibraryWithShow | null> {
    return queryOne<UserLibraryWithShow>(
      `SELECT ul.*, s.tmdb_id, s.title, s.media_type, s.poster_path, s.backdrop_path, s.rating
       FROM user_library ul
       JOIN shows s ON s.id = ul.show_id
       WHERE ul.user_id = $1 AND s.tmdb_id = $2`,
      [userId, tmdbId]
    );
  }

  static async add(userId: number, showId: number, status: string = 'planning_to_watch'): Promise<UserLibraryEntry> {
    await ensureLibraryColumns();
    const result = await queryOne<UserLibraryEntry>(
      `INSERT INTO user_library (user_id, show_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, show_id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, showId, status]
    );
    if (!result) throw new Error('Failed to add to watchlist');
    return result;
  }

  static async updateStatus(userId: number, showId: number, status: string): Promise<UserLibraryEntry | null> {
    await ensureLibraryColumns();
    return queryOne<UserLibraryEntry>(
      `UPDATE user_library
       SET status = $3,
           updated_at = CURRENT_TIMESTAMP,
           date_started = CASE
             WHEN $4 = 'watching' AND date_started IS NULL THEN CURRENT_DATE
             ELSE date_started
           END,
           date_completed = CASE
             WHEN $4 = 'completed' THEN CURRENT_DATE
             WHEN $4 != 'completed' THEN NULL
             ELSE date_completed
           END
       WHERE user_id = $1 AND show_id = $2
       RETURNING *`,
      [userId, showId, status, status]
    );
  }

  static async updateFavorite(userId: number, showId: number, isFavorite: boolean): Promise<UserLibraryEntry | null> {
    return queryOne<UserLibraryEntry>(
      `UPDATE user_library SET is_favorite = $3, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND show_id = $2
       RETURNING *`,
      [userId, showId, isFavorite]
    );
  }

  static async clearProgress(userId: number, showId: number): Promise<UserLibraryEntry | null> {
    return queryOne<UserLibraryEntry>(
      `UPDATE user_library SET current_season = NULL, current_episode = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND show_id = $2
       RETURNING *`,
      [userId, showId]
    );
  }

  static async updateProgress(userId: number, showId: number, season: number, episode: number): Promise<UserLibraryEntry | null> {
    return queryOne<UserLibraryEntry>(
      `UPDATE user_library SET current_season = $3, current_episode = $4, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND show_id = $2
       RETURNING *`,
      [userId, showId, season, episode]
    );
  }

  static async updateRating(userId: number, showId: number, rating: number | null): Promise<UserLibraryEntry | null> {
    return queryOne<UserLibraryEntry>(
      `UPDATE user_library SET personal_rating = $3, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND show_id = $2
       RETURNING *`,
      [userId, showId, rating]
    );
  }

  static async getLastSeason(showId: number): Promise<{ season_number: number; episode_count: number } | null> {
    return queryOne<{ season_number: number; episode_count: number }>(
      `SELECT season_number, episode_count FROM seasons
       WHERE show_id = $1 AND episode_count > 0
       ORDER BY season_number DESC LIMIT 1`,
      [showId]
    );
  }

  static async remove(userId: number, showId: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM user_library WHERE user_id = $1 AND show_id = $2`,
      [userId, showId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
