import { db } from '@/lib/db';
import { sql } from 'kysely';

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
    const result = await db
      .insertInto('watch_progress')
      .values({
        user_id: input.userId,
        tmdb_id: input.tmdbId,
        media_type: input.mediaType,
        season,
        episode,
        progress_seconds: input.progressSeconds ?? 0,
        duration_seconds: input.durationSeconds ?? 0,
        progress_percent: input.progressPercent ?? 0,
        title: input.title ?? null,
        poster_path: input.posterPath ?? null,
        backdrop_path: input.backdropPath ?? null,
        completed: input.completed ?? false,
      })
      .onConflict((oc) =>
        oc.columns(['user_id', 'tmdb_id', 'media_type', 'season', 'episode']).doUpdateSet({
          progress_seconds: sql`excluded.progress_seconds`,
          duration_seconds: sql`excluded.duration_seconds`,
          progress_percent: sql`excluded.progress_percent`,
          title: sql`COALESCE(excluded.title, watch_progress.title)`,
          poster_path: sql`COALESCE(excluded.poster_path, watch_progress.poster_path)`,
          backdrop_path: sql`COALESCE(excluded.backdrop_path, watch_progress.backdrop_path)`,
          completed: sql`excluded.completed`,
          last_watched_at: new Date(),
        })
      )
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as unknown as WatchProgress;
  }

  // returns unfinished items, most-recently-watched first
  // 1 row / show
  static async listContinueWatching(userId: number, limit: number = 20): Promise<WatchProgress[]> {
    const { rows } = await sql<WatchProgress>`
      SELECT DISTINCT ON (tmdb_id, media_type) *
      FROM watch_progress
      WHERE user_id = ${userId} AND completed = FALSE
      ORDER BY tmdb_id, media_type, last_watched_at DESC
    `.execute(db);
    return rows
      .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime())
      .slice(0, limit);
  }

  static async deleteEntry(
    userId: number,
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    season: number = 0,
    episode: number = 0
  ): Promise<void> {
    await db
      .deleteFrom('watch_progress')
      .where('user_id', '=', userId)
      .where('tmdb_id', '=', tmdbId)
      .where('media_type', '=', mediaType)
      .where('season', '=', season)
      .where('episode', '=', episode)
      .execute();
  }
}
