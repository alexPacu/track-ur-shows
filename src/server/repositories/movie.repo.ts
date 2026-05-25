import { db } from '@/lib/db';
import { sql } from 'kysely';

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
  total_episodes?: number;
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
    data: Omit<Show, 'id' | 'tmdb_id' | 'created_at' | 'updated_at'>
  ): Promise<Show> {
    const result = await db
      .insertInto('shows')
      .values({
        tmdb_id: tmdbId,
        title: data.title,
        description: data.description ?? null,
        media_type: data.media_type,
        genres: data.genres ? JSON.stringify(data.genres) : null,
        rating: data.rating ?? null,
        release_date: data.release_date ?? null,
        poster_path: data.poster_path ?? null,
        backdrop_path: data.backdrop_path ?? null,
        runtime: data.runtime ?? null,
        total_episodes: data.total_episodes ?? null,
      })
      .onConflict((oc) =>
        oc.column('tmdb_id').doUpdateSet({
          title: sql`excluded.title`,
          description: sql`COALESCE(excluded.description, shows.description)`,
          genres: sql`COALESCE(excluded.genres, shows.genres)`,
          release_date: sql`COALESCE(excluded.release_date, shows.release_date)`,
          poster_path: sql`COALESCE(excluded.poster_path, shows.poster_path)`,
          backdrop_path: sql`COALESCE(excluded.backdrop_path, shows.backdrop_path)`,
          rating: sql`COALESCE(excluded.rating, shows.rating)`,
          runtime: sql`COALESCE(excluded.runtime, shows.runtime)`,
          total_episodes: sql`COALESCE(excluded.total_episodes, shows.total_episodes)`,
          updated_at: new Date(),
        })
      )
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as unknown as Show;
  }

  static async findById(id: number): Promise<Show | null> {
    const result = await db.selectFrom('shows').selectAll().where('id', '=', id).executeTakeFirst();
    return result ? (result as unknown as Show) : null;
  }

  static async findByTmdbId(tmdbId: number): Promise<Show | null> {
    const result = await db.selectFrom('shows').selectAll().where('tmdb_id', '=', tmdbId).executeTakeFirst();
    return result ? (result as unknown as Show) : null;
  }

  static async search(query_text: string, limit: number = 20): Promise<Show[]> {
    const rows = await db
      .selectFrom('shows')
      .selectAll()
      .where('title', 'ilike', `%${query_text}%`)
      .orderBy(sql`rating DESC NULLS LAST`)
      .limit(limit)
      .execute();
    return rows as unknown as Show[];
  }

  static async getByMediaType(mediaType: 'movie' | 'tv', limit: number = 20, offset: number = 0): Promise<Show[]> {
    const rows = await db
      .selectFrom('shows')
      .selectAll()
      .where('media_type', '=', mediaType)
      .orderBy(sql`rating DESC NULLS LAST`)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
    return rows as unknown as Show[];
  }

  static async getPopular(limit: number = 20): Promise<Show[]> {
    const rows = await db
      .selectFrom('shows')
      .selectAll()
      .orderBy(sql`rating DESC NULLS LAST`)
      .limit(limit)
      .execute();
    return rows as unknown as Show[];
  }

  static async upsertProviders(showId: number, watchProviders: Record<string, any>): Promise<void> {
    const TYPE_ORDER = ['flatrate', 'buy', 'rent'] as const;

    const providerMap = new Map<number, { name: string; logoPath: string | null; type: string }>();
    const links: { tmdbProviderId: number; region: string; type: string }[] = [];

    for (const [region, data] of Object.entries(watchProviders)) {
      for (const type of TYPE_ORDER) {
        for (const p of ((data as any)[type] || [])) {
          if (!providerMap.has(p.provider_id)) {
            providerMap.set(p.provider_id, { name: p.provider_name, logoPath: p.logo_path ?? null, type });
          }
          links.push({ tmdbProviderId: p.provider_id, region, type });
        }
      }
    }

    if (providerMap.size === 0) return;

    const dbIds = new Map<number, number>();
    for (const [tmdbProviderId, info] of providerMap) {
      const row = await db
        .insertInto('watch_providers')
        .values({
          tmdb_provider_id: tmdbProviderId,
          name: info.name,
          logo_path: info.logoPath,
          provider_type: info.type as any,
        })
        .onConflict((oc) =>
          oc.column('tmdb_provider_id').doUpdateSet({
            name: sql`excluded.name`,
            logo_path: sql`COALESCE(excluded.logo_path, watch_providers.logo_path)`,
          })
        )
        .returning('id')
        .executeTakeFirst();
      if (row) dbIds.set(tmdbProviderId, row.id);
    }

    for (const link of links) {
      const dbId = dbIds.get(link.tmdbProviderId);
      if (!dbId) continue;
      await db
        .insertInto('show_watch_providers')
        .values({
          show_id: showId,
          provider_id: dbId,
          region: link.region,
          provider_type: link.type as any,
        })
        .onConflict((oc) =>
          oc.columns(['show_id', 'provider_id', 'region', 'provider_type']).doNothing()
        )
        .execute();
    }
  }

  static async update(id: number, data: Partial<Show>): Promise<Show | null> {
    const updates: Record<string, unknown> = {};
    if (data.rating !== undefined) updates.rating = data.rating;
    if (data.genres !== undefined) updates.genres = data.genres ? JSON.stringify(data.genres) : null;
    if (Object.keys(updates).length === 0) return this.findById(id);
    updates.updated_at = new Date();
    const result = await db
      .updateTable('shows')
      .set(updates as any)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as Show) : null;
  }
}

export class SeasonRepository {
  static async findOrCreate(
    showId: number,
    seasonNumber: number,
    data?: Omit<Season, 'id' | 'show_id' | 'season_number' | 'created_at'>
  ): Promise<Season> {
    const existing = await db
      .selectFrom('seasons')
      .selectAll()
      .where('show_id', '=', showId)
      .where('season_number', '=', seasonNumber)
      .executeTakeFirst();
    if (existing) return existing as unknown as Season;

    const result = await db
      .insertInto('seasons')
      .values({
        show_id: showId,
        season_number: seasonNumber,
        air_date: data?.air_date ?? null,
        episode_count: data?.episode_count ?? null,
        poster_path: data?.poster_path ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as unknown as Season;
  }

  static async findById(id: number): Promise<Season | null> {
    const result = await db.selectFrom('seasons').selectAll().where('id', '=', id).executeTakeFirst();
    return result ? (result as unknown as Season) : null;
  }

  static async getByShow(showId: number): Promise<Season[]> {
    const rows = await db
      .selectFrom('seasons')
      .selectAll()
      .where('show_id', '=', showId)
      .orderBy('season_number', 'asc')
      .execute();
    return rows as unknown as Season[];
  }
}

export class EpisodeRepository {
  static async findOrCreate(
    seasonId: number,
    showId: number,
    episodeNumber: number,
    data: Omit<Episode, 'id' | 'season_id' | 'show_id' | 'episode_number' | 'created_at'>
  ): Promise<Episode> {
    const existing = await db
      .selectFrom('episodes')
      .selectAll()
      .where('season_id', '=', seasonId)
      .where('episode_number', '=', episodeNumber)
      .executeTakeFirst();
    if (existing) return existing as unknown as Episode;

    const result = await db
      .insertInto('episodes')
      .values({
        season_id: seasonId,
        show_id: showId,
        episode_number: episodeNumber,
        name: data.name,
        air_date: data.air_date ?? null,
        runtime: data.runtime ?? null,
        still_path: data.still_path ?? null,
        overview: data.overview ?? null,
        vote_average: data.vote_average ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as unknown as Episode;
  }

  static async findById(id: number): Promise<Episode | null> {
    const result = await db.selectFrom('episodes').selectAll().where('id', '=', id).executeTakeFirst();
    return result ? (result as unknown as Episode) : null;
  }

  static async getBySeason(seasonId: number): Promise<Episode[]> {
    const rows = await db
      .selectFrom('episodes')
      .selectAll()
      .where('season_id', '=', seasonId)
      .orderBy('episode_number', 'asc')
      .execute();
    return rows as unknown as Episode[];
  }

  static async getByShow(showId: number): Promise<Episode[]> {
    const rows = await db
      .selectFrom('episodes')
      .selectAll()
      .where('show_id', '=', showId)
      .orderBy('air_date', 'asc')
      .execute();
    return rows as unknown as Episode[];
  }
}
