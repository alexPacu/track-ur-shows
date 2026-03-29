import { query, queryOne, queryMany } from '@/lib/db';

export interface Show {
  id: number;
  tmdb_id: number;
  title: string;
  description?: string;
  media_type: 'movie' | 'tv';
  genres?: number[];
  rating?: number;
  release_date?: Date;
  poster_path?: string;
  backdrop_path?: string;
  runtime?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Season {
  id: number;
  show_id: number;
  season_number: number;
  air_date?: Date;
  episode_count?: number;
  poster_path?: string;
  created_at: Date;
}

export interface Episode {
  id: number;
  season_id: number;
  show_id: number;
  episode_number: number;
  name: string;
  air_date?: Date;
  runtime?: number;
  still_path?: string;
  overview?: string;
  vote_average?: number;
  created_at: Date;
}

export class ShowRepository {
  static async findOrCreateByTmdbId(
    tmdbId: number,
    data: Omit<Show, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Show> {
    const existing = await queryOne<Show>(
      `SELECT * FROM shows WHERE tmdb_id = $1`,
      [tmdbId]
    );
    if (existing) return existing;

    const result = await queryOne<Show>(
      `INSERT INTO shows (tmdb_id, title, description, media_type, genres, rating, release_date, poster_path, backdrop_path, runtime)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        tmdbId,
        data.title,
        data.description,
        data.media_type,
        data.genres ? JSON.stringify(data.genres) : null,
        data.rating,
        data.release_date,
        data.poster_path,
        data.backdrop_path,
        data.runtime,
      ]
    );
    if (!result) throw new Error('Failed to create show');
    return result;
  }

  static async findById(id: number): Promise<Show | null> {
    return queryOne<Show>(
      `SELECT * FROM shows WHERE id = $1`,
      [id]
    );
  }

  static async findByTmdbId(tmdbId: number): Promise<Show | null> {
    return queryOne<Show>(
      `SELECT * FROM shows WHERE tmdb_id = $1`,
      [tmdbId]
    );
  }

  static async search(
    query_text: string,
    limit: number = 20
  ): Promise<Show[]> {
    return queryMany<Show>(
      `SELECT * FROM shows
       WHERE title ILIKE $1
       ORDER BY rating DESC NULLS LAST
       LIMIT $2`,
      [`%${query_text}%`, limit]
    );
  }

  static async getByMediaType(
    mediaType: 'movie' | 'tv',
    limit: number = 20,
    offset: number = 0
  ): Promise<Show[]> {
    return queryMany<Show>(
      `SELECT * FROM shows
       WHERE media_type = $1
       ORDER BY rating DESC NULLS LAST, created_at DESC
       LIMIT $2 OFFSET $3`,
      [mediaType, limit, offset]
    );
  }

  static async getPopular(
    limit: number = 20
  ): Promise<Show[]> {
    return queryMany<Show>(
      `SELECT * FROM shows
       ORDER BY rating DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );
  }

  static async update(
    id: number,
    data: Partial<Show>
  ): Promise<Show | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.rating !== undefined) {
      updates.push(`rating = $${paramCount++}`);
      values.push(data.rating);
    }
    if (data.genres !== undefined) {
      updates.push(`genres = $${paramCount++}`);
      values.push(data.genres ? JSON.stringify(data.genres) : null);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    return queryOne<Show>(
      `UPDATE shows SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
  }
}

export class SeasonRepository {
  static async findOrCreate(
    showId: number,
    seasonNumber: number,
    data?: Omit<Season, 'id' | 'show_id' | 'season_number' | 'created_at'>
  ): Promise<Season> {
    const existing = await queryOne<Season>(
      `SELECT * FROM seasons WHERE show_id = $1 AND season_number = $2`,
      [showId, seasonNumber]
    );
    if (existing) return existing;

    const result = await queryOne<Season>(
      `INSERT INTO seasons (show_id, season_number, air_date, episode_count, poster_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [showId, seasonNumber, data?.air_date, data?.episode_count, data?.poster_path]
    );
    if (!result) throw new Error('Failed to create season');
    return result;
  }

  static async findById(id: number): Promise<Season | null> {
    return queryOne<Season>(
      `SELECT * FROM seasons WHERE id = $1`,
      [id]
    );
  }

  static async getByShow(showId: number): Promise<Season[]> {
    return queryMany<Season>(
      `SELECT * FROM seasons WHERE show_id = $1 ORDER BY season_number ASC`,
      [showId]
    );
  }
}

export class EpisodeRepository {
  static async findOrCreate(
    seasonId: number,
    showId: number,
    episodeNumber: number,
    data: Omit<Episode, 'id' | 'season_id' | 'show_id' | 'episode_number' | 'created_at'>
  ): Promise<Episode> {
    const existing = await queryOne<Episode>(
      `SELECT * FROM episodes WHERE season_id = $1 AND episode_number = $2`,
      [seasonId, episodeNumber]
    );
    if (existing) return existing;

    const result = await queryOne<Episode>(
      `INSERT INTO episodes (season_id, show_id, episode_number, name, air_date, runtime, still_path, overview, vote_average)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [seasonId, showId, episodeNumber, data.name, data.air_date, data.runtime, data.still_path, data.overview, data.vote_average]
    );
    if (!result) throw new Error('Failed to create episode');
    return result;
  }

  static async findById(id: number): Promise<Episode | null> {
    return queryOne<Episode>(
      `SELECT * FROM episodes WHERE id = $1`,
      [id]
    );
  }

  static async getBySeason(seasonId: number): Promise<Episode[]> {
    return queryMany<Episode>(
      `SELECT * FROM episodes WHERE season_id = $1 ORDER BY episode_number ASC`,
      [seasonId]
    );
  }

  static async getByShow(showId: number): Promise<Episode[]> {
    return queryMany<Episode>(
      `SELECT * FROM episodes WHERE show_id = $1 ORDER BY air_date ASC`,
      [showId]
    );
  }
}
