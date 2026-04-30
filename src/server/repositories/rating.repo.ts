import { db } from '@/lib/db';
import { sql } from 'kysely';

export type UserLibraryStatus = 'watching' | 'completed' | 'dropped' | 'paused' | 'planning_to_watch';

export interface UserLibrary {
  id: number;
  user_id: number;
  show_id: number;
  status: UserLibraryStatus;
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

export interface UserEpisode {
  id: number;
  user_id: number;
  episode_id: number;
  watched_date: Date;
  personal_rating?: number;
  created_at: Date;
}

export class UserLibraryRepository {
  static async addShow(userId: number, showId: number, status: UserLibraryStatus = 'planning_to_watch'): Promise<UserLibrary> {
    const result = await db
      .insertInto('user_library')
      .values({ user_id: userId, show_id: showId, status })
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as unknown as UserLibrary;
  }

  static async findByUserAndShow(userId: number, showId: number): Promise<UserLibrary | null> {
    const result = await db
      .selectFrom('user_library')
      .selectAll()
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .executeTakeFirst();
    return result ? (result as unknown as UserLibrary) : null;
  }

  static async getByUser(
    userId: number,
    status?: UserLibraryStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserLibrary[]> {
    let query = db.selectFrom('user_library').selectAll().where('user_id', '=', userId);
    if (status) query = query.where('status', '=', status);
    const rows = await query.orderBy('updated_at', 'desc').limit(limit).offset(offset).execute();
    return rows as unknown as UserLibrary[];
  }

  static async updateStatus(userId: number, showId: number, status: UserLibraryStatus): Promise<UserLibrary | null> {
    const result = await db
      .updateTable('user_library')
      .set({ status, updated_at: new Date() })
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as UserLibrary) : null;
  }

  static async updateProgress(
    userId: number,
    showId: number,
    data: {
      current_season?: number;
      current_episode?: number;
      hours_watched?: number;
      times_rewatched?: number;
    }
  ): Promise<UserLibrary | null> {
    const updates: Record<string, unknown> = {};
    if (data.current_season !== undefined) updates.current_season = data.current_season;
    if (data.current_episode !== undefined) updates.current_episode = data.current_episode;
    if (data.hours_watched !== undefined) updates.hours_watched = data.hours_watched;
    if (data.times_rewatched !== undefined) updates.times_rewatched = data.times_rewatched;
    if (Object.keys(updates).length === 0) return this.findByUserAndShow(userId, showId);
    updates.updated_at = new Date();
    const result = await db
      .updateTable('user_library')
      .set(updates as any)
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as UserLibrary) : null;
  }

  static async updateRating(userId: number, showId: number, rating: number | null): Promise<UserLibrary | null> {
    const result = await db
      .updateTable('user_library')
      .set({ personal_rating: rating, updated_at: new Date() })
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as UserLibrary) : null;
  }

  static async toggleFavorite(userId: number, showId: number): Promise<UserLibrary | null> {
    const result = await db
      .updateTable('user_library')
      .set({ is_favorite: sql`NOT is_favorite`, updated_at: new Date() })
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as UserLibrary) : null;
  }

  static async removeShow(userId: number, showId: number): Promise<boolean> {
    const [result] = await db
      .deleteFrom('user_library')
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .execute();
    return (result?.numDeletedRows ?? 0n) > 0n;
  }

  static async markEpisodeWatched(userId: number, episodeId: number, watchedDate: Date = new Date()): Promise<UserEpisode> {
    const result = await db
      .insertInto('user_episodes')
      .values({ user_id: userId, episode_id: episodeId, watched_date: watchedDate })
      .onConflict((oc) =>
        oc.columns(['user_id', 'episode_id']).doUpdateSet({ watched_date: sql`excluded.watched_date` })
      )
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as unknown as UserEpisode;
  }

  static async isEpisodeWatched(userId: number, episodeId: number): Promise<boolean> {
    const result = await db
      .selectFrom('user_episodes')
      .select('id')
      .where('user_id', '=', userId)
      .where('episode_id', '=', episodeId)
      .executeTakeFirst();
    return !!result;
  }

  static async getWatchedEpisodes(userId: number, showId: number): Promise<UserEpisode[]> {
    const rows = await db
      .selectFrom('user_episodes as ue')
      .innerJoin('episodes as e', 'e.id', 'ue.episode_id')
      .selectAll('ue')
      .where('ue.user_id', '=', userId)
      .where('e.show_id', '=', showId)
      .orderBy('e.air_date', 'asc')
      .execute();
    return rows as unknown as UserEpisode[];
  }
}
