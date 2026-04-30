import { db } from '@/lib/db';
import { sql } from 'kysely';

let _libraryColumnsEnsured = false;
async function ensureLibraryColumns() {
  if (_libraryColumnsEnsured) return;
  await sql`ALTER TABLE user_library ADD COLUMN IF NOT EXISTS date_started DATE`.execute(db);
  await sql`ALTER TABLE user_library ADD COLUMN IF NOT EXISTS date_completed DATE`.execute(db);
  await sql`ALTER TABLE user_library ADD COLUMN IF NOT EXISTS hours_watched DECIMAL(10,2) DEFAULT 0`.execute(db);
  await sql`ALTER TABLE user_library ADD COLUMN IF NOT EXISTS times_rewatched INTEGER DEFAULT 0`.execute(db);
  await sql`ALTER TABLE user_library ADD COLUMN IF NOT EXISTS notes TEXT`.execute(db);
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
    const rows = await db
      .selectFrom('user_library as ul')
      .innerJoin('shows as s', 's.id', 'ul.show_id')
      .selectAll('ul')
      .select(['s.tmdb_id', 's.title', 's.media_type', 's.poster_path', 's.backdrop_path', 's.rating', 's.genres'])
      .where('ul.user_id', '=', userId)
      .orderBy('ul.updated_at', 'desc')
      .execute();
    return rows as unknown as UserLibraryWithShow[];
  }

  static async findByUserAndTmdbId(userId: number, tmdbId: number): Promise<UserLibraryWithShow | null> {
    const result = await db
      .selectFrom('user_library as ul')
      .innerJoin('shows as s', 's.id', 'ul.show_id')
      .selectAll('ul')
      .select(['s.tmdb_id', 's.title', 's.media_type', 's.poster_path', 's.backdrop_path', 's.rating'])
      .where('ul.user_id', '=', userId)
      .where('s.tmdb_id', '=', tmdbId)
      .executeTakeFirst();
    return result ? (result as unknown as UserLibraryWithShow) : null;
  }

  static async add(userId: number, showId: number, status: string = 'planning_to_watch'): Promise<UserLibraryEntry> {
    await ensureLibraryColumns();
    const result = await db
      .insertInto('user_library')
      .values({ user_id: userId, show_id: showId, status: status as any })
      .onConflict((oc) =>
        oc.columns(['user_id', 'show_id']).doUpdateSet({
          status: sql`excluded.status`,
          updated_at: new Date(),
        })
      )
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as unknown as UserLibraryEntry;
  }

  static async updateStatus(userId: number, showId: number, status: string): Promise<UserLibraryEntry | null> {
    await ensureLibraryColumns();
    const result = await db
      .updateTable('user_library')
      .set({
        status: status as any,
        updated_at: new Date(),
        date_started: sql`CASE WHEN ${sql.lit(status)} = 'watching' AND date_started IS NULL THEN CURRENT_DATE ELSE date_started END`,
        date_completed: sql`CASE WHEN ${sql.lit(status)} = 'completed' THEN CURRENT_DATE WHEN ${sql.lit(status)} != 'completed' THEN NULL ELSE date_completed END`,
      })
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as UserLibraryEntry) : null;
  }

  static async updateFavorite(userId: number, showId: number, isFavorite: boolean): Promise<UserLibraryEntry | null> {
    const result = await db
      .updateTable('user_library')
      .set({ is_favorite: isFavorite, updated_at: new Date() })
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as UserLibraryEntry) : null;
  }

  static async clearProgress(userId: number, showId: number): Promise<UserLibraryEntry | null> {
    const result = await db
      .updateTable('user_library')
      .set({ current_season: null, current_episode: null, updated_at: new Date() })
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as UserLibraryEntry) : null;
  }

  static async updateProgress(userId: number, showId: number, season: number, episode: number): Promise<UserLibraryEntry | null> {
    const result = await db
      .updateTable('user_library')
      .set({ current_season: season, current_episode: episode, updated_at: new Date() })
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as UserLibraryEntry) : null;
  }

  static async updateRating(userId: number, showId: number, rating: number | null): Promise<UserLibraryEntry | null> {
    const result = await db
      .updateTable('user_library')
      .set({ personal_rating: rating, updated_at: new Date() })
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as UserLibraryEntry) : null;
  }

  static async getLastSeason(showId: number): Promise<{ season_number: number; episode_count: number } | null> {
    const result = await db
      .selectFrom('seasons')
      .select(['season_number', 'episode_count'])
      .where('show_id', '=', showId)
      .where('episode_count', '>', 0)
      .orderBy('season_number', 'desc')
      .limit(1)
      .executeTakeFirst();
    return result ? (result as unknown as { season_number: number; episode_count: number }) : null;
  }

  static async remove(userId: number, showId: number): Promise<boolean> {
    const [result] = await db
      .deleteFrom('user_library')
      .where('user_id', '=', userId)
      .where('show_id', '=', showId)
      .execute();
    return (result?.numDeletedRows ?? 0n) > 0n;
  }
}
