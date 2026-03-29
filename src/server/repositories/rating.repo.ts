import { query, queryOne, queryMany } from '@/lib/db';

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
  static async addShow(
    userId: number,
    showId: number,
    status: UserLibraryStatus = 'planning_to_watch'
  ): Promise<UserLibrary> {
    const result = await queryOne<UserLibrary>(
      `INSERT INTO user_library (user_id, show_id, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, showId, status]
    );
    if (!result) throw new Error('Failed to add show to library');
    return result;
  }

  static async findByUserAndShow(
    userId: number,
    showId: number
  ): Promise<UserLibrary | null> {
    return queryOne<UserLibrary>(
      `SELECT * FROM user_library WHERE user_id = $1 AND show_id = $2`,
      [userId, showId]
    );
  }

  static async getByUser(
    userId: number,
    status?: UserLibraryStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserLibrary[]> {
    if (status) {
      return queryMany<UserLibrary>(
        `SELECT * FROM user_library
         WHERE user_id = $1 AND status = $2
         ORDER BY updated_at DESC
         LIMIT $3 OFFSET $4`,
        [userId, status, limit, offset]
      );
    }
    return queryMany<UserLibrary>(
      `SELECT * FROM user_library
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
  }

  static async updateStatus(
    userId: number,
    showId: number,
    status: UserLibraryStatus
  ): Promise<UserLibrary | null> {
    return queryOne<UserLibrary>(
      `UPDATE user_library
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND show_id = $3
       RETURNING *`,
      [status, userId, showId]
    );
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
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.current_season !== undefined) {
      updates.push(`current_season = $${paramCount++}`);
      values.push(data.current_season);
    }
    if (data.current_episode !== undefined) {
      updates.push(`current_episode = $${paramCount++}`);
      values.push(data.current_episode);
    }
    if (data.hours_watched !== undefined) {
      updates.push(`hours_watched = $${paramCount++}`);
      values.push(data.hours_watched);
    }
    if (data.times_rewatched !== undefined) {
      updates.push(`times_rewatched = $${paramCount++}`);
      values.push(data.times_rewatched);
    }

    if (updates.length === 0) {
      return this.findByUserAndShow(userId, showId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId, showId);
    const paramCount2 = paramCount + 2;

    return queryOne<UserLibrary>(
      `UPDATE user_library
       SET ${updates.join(', ')}
       WHERE user_id = $${paramCount2 - 1} AND show_id = $${paramCount2}
       RETURNING *`,
      values
    );
  }

  static async updateRating(
    userId: number,
    showId: number,
    rating: number | null
  ): Promise<UserLibrary | null> {
    return queryOne<UserLibrary>(
      `UPDATE user_library
       SET personal_rating = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND show_id = $3
       RETURNING *`,
      [rating, userId, showId]
    );
  }

  static async toggleFavorite(
    userId: number,
    showId: number
  ): Promise<UserLibrary | null> {
    return queryOne<UserLibrary>(
      `UPDATE user_library
       SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND show_id = $2
       RETURNING *`,
      [userId, showId]
    );
  }

  static async removeShow(
    userId: number,
    showId: number
  ): Promise<boolean> {
    const result = await query(
      `DELETE FROM user_library WHERE user_id = $1 AND show_id = $2`,
      [userId, showId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  static async markEpisodeWatched(
    userId: number,
    episodeId: number,
    watchedDate: Date = new Date()
  ): Promise<UserEpisode> {
    const result = await queryOne<UserEpisode>(
      `INSERT INTO user_episodes (user_id, episode_id, watched_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, episode_id) DO UPDATE
       SET watched_date = EXCLUDED.watched_date
       RETURNING *`,
      [userId, episodeId, watchedDate]
    );
    if (!result) throw new Error('Failed to mark episode as watched');
    return result;
  }

  static async isEpisodeWatched(
    userId: number,
    episodeId: number
  ): Promise<boolean> {
    const result = await queryOne<{ id: number }>(
      `SELECT id FROM user_episodes WHERE user_id = $1 AND episode_id = $2`,
      [userId, episodeId]
    );
    return !!result;
  }

  static async getWatchedEpisodes(
    userId: number,
    showId: number
  ): Promise<UserEpisode[]> {
    return queryMany<UserEpisode>(
      `SELECT ue.* FROM user_episodes ue
       INNER JOIN episodes e ON ue.episode_id = e.id
       WHERE ue.user_id = $1 AND e.show_id = $2
       ORDER BY e.air_date ASC`,
      [userId, showId]
    );
  }
}
