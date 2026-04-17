import { queryOne, queryMany, query } from '@/lib/db';

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
    return queryOne<UserLibraryEntry>(
      `UPDATE user_library
       SET status = $3,
           updated_at = CURRENT_TIMESTAMP,
           date_started = CASE
             WHEN $3 = 'watching' AND date_started IS NULL THEN CURRENT_DATE
             ELSE date_started
           END,
           date_completed = CASE
             WHEN $3 = 'completed' THEN CURRENT_DATE
             WHEN $3 != 'completed' THEN NULL
             ELSE date_completed
           END
       WHERE user_id = $1 AND show_id = $2
       RETURNING *`,
      [userId, showId, status]
    );
  }

  static async updateFavorite(userId: number, showId: number, isFavorite: boolean): Promise<UserLibraryEntry | null> {
    return queryOne<UserLibraryEntry>(
      `UPDATE user_library SET is_favorite = $3
       WHERE user_id = $1 AND show_id = $2
       RETURNING *`,
      [userId, showId, isFavorite]
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

  static async remove(userId: number, showId: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM user_library WHERE user_id = $1 AND show_id = $2`,
      [userId, showId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
