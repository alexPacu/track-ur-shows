import { queryOne, queryMany } from '@/lib/db';

export interface WatchProgress {
  id: number;
  user_id: number;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  season: number;
  episode: number;
  progress_seconds: number;
  duration_seconds: number;
  progress_percent: number;
  title: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  completed: boolean;
  last_watched_at: Date;
  created_at: Date;
}

export interface UpsertWatchProgressInput {
  userId: number;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  progressSeconds?: number;
  durationSeconds?: number;
  progressPercent?: number;
  title?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  completed?: boolean;
}

export class WatchProgressRepository {
  // upsert by (user, tmdb_id, media_type, season, episode)
  // movies store season=0, episode=0
  static async upsert(input: UpsertWatchProgressInput): Promise<WatchProgress> {
    const season = input.season ?? 0;
    const episode = input.episode ?? 0;
    const result = await queryOne<WatchProgress>(
      `INSERT INTO watch_progress
        (user_id, tmdb_id, media_type, season, episode,
         progress_seconds, duration_seconds, progress_percent,
         title, poster_path, backdrop_path, completed, last_watched_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, tmdb_id, media_type, season, episode)
       DO UPDATE SET
         progress_seconds = EXCLUDED.progress_seconds,
         duration_seconds = EXCLUDED.duration_seconds,
         progress_percent = EXCLUDED.progress_percent,
         title = COALESCE(EXCLUDED.title, watch_progress.title),
         poster_path = COALESCE(EXCLUDED.poster_path, watch_progress.poster_path),
         backdrop_path = COALESCE(EXCLUDED.backdrop_path, watch_progress.backdrop_path),
         completed = EXCLUDED.completed,
         last_watched_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        input.userId,
        input.tmdbId,
        input.mediaType,
        season,
        episode,
        input.progressSeconds ?? 0,
        input.durationSeconds ?? 0,
        input.progressPercent ?? 0,
        input.title ?? null,
        input.posterPath ?? null,
        input.backdropPath ?? null,
        input.completed ?? false,
      ]
    );
    if (!result) throw new Error('Failed to upsert watch progress');
    return result;
  }

  // returns unfinished items, most-recently-watched first
  // 1 row / show
  static async listContinueWatching(userId: number, limit: number = 20): Promise<WatchProgress[]> {
    return queryMany<WatchProgress>(
      `SELECT DISTINCT ON (tmdb_id, media_type) *
       FROM watch_progress
       WHERE user_id = $1 AND completed = FALSE
       ORDER BY tmdb_id, media_type, last_watched_at DESC`,
      [userId]
    ).then((rows) =>
      rows
        .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime())
        .slice(0, limit)
    );
  }

  static async deleteEntry(
    userId: number,
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    season: number = 0,
    episode: number = 0
  ): Promise<void> {
    await queryOne(
      `DELETE FROM watch_progress
       WHERE user_id = $1 AND tmdb_id = $2 AND media_type = $3 AND season = $4 AND episode = $5`,
      [userId, tmdbId, mediaType, season, episode]
    );
  }
}
