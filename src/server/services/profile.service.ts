import { db } from '@/lib/db';
import { sql } from 'kysely';

export interface ProfileStats {
  total: number;
  watching: number;
  completed: number;
  planned: number;
  movies: number;
  tv_shows: number;
  avg_personal_rating: number | null;
  total_minutes_watched: number;
}

export interface ProfileCharts {
  genres: { genreId: number; count: number }[];
  providers: { name: string; logoPath: string | null; count: number }[];
  activity: {
    tmdb_id: number;
    title: string;
    media_type: string;
    poster_path: string | null;
    status: string;
    personal_rating: number | null;
    updated_at: string;
  }[];
  statuses: { status: string; count: number }[];
  favorites: {
    tmdb_id: number;
    title: string;
    media_type: string;
    poster_path: string | null;
    status: string;
    personal_rating: number | null;
  }[];
  ratingDistribution: { rating: number; count: number }[];
  heatmap: { day: string; count: number }[];
}

export class ProfileService {
  static async getStats(userId: number): Promise<ProfileStats> {
    const [counts, hours] = await Promise.all([
      db
        .selectFrom('user_library as ul')
        .innerJoin('shows as s', 's.id', 'ul.show_id')
        .where('ul.user_id', '=', userId)
        .select([
          sql<string>`COUNT(*)`.as('total'),
          sql<string>`COUNT(*) FILTER (WHERE ul.status = 'watching')`.as('watching'),
          sql<string>`COUNT(*) FILTER (WHERE ul.status = 'completed')`.as('completed'),
          sql<string>`COUNT(*) FILTER (WHERE ul.status = 'planning_to_watch')`.as('planned'),
          sql<string>`COUNT(*) FILTER (WHERE s.media_type = 'movie')`.as('movies'),
          sql<string>`COUNT(*) FILTER (WHERE s.media_type = 'tv')`.as('tv_shows'),
          sql<string | null>`ROUND(AVG(ul.personal_rating) FILTER (WHERE ul.personal_rating IS NOT NULL), 1)`.as('avg_personal_rating'),
        ])
        .executeTakeFirst(),
      db
        .selectFrom('user_library as ul')
        .innerJoin('shows as s', 's.id', 'ul.show_id')
        .where('ul.user_id', '=', userId)
        .where('ul.status', '=', 'completed')
        .select(
          sql<string>`COALESCE(SUM(
            CASE
              WHEN s.media_type = 'movie' THEN COALESCE(s.runtime, 0)
              WHEN s.media_type = 'tv' THEN
                COALESCE(s.runtime, 45) * COALESCE(
                  s.total_episodes,
                  (SELECT SUM(se.episode_count) FROM seasons se WHERE se.show_id = s.id),
                  0
                )
              ELSE 0
            END
          ), 0)`.as('total_minutes')
        )
        .executeTakeFirst(),
    ]);

    return {
      total: Number(counts?.total ?? 0),
      watching: Number(counts?.watching ?? 0),
      completed: Number(counts?.completed ?? 0),
      planned: Number(counts?.planned ?? 0),
      movies: Number(counts?.movies ?? 0),
      tv_shows: Number(counts?.tv_shows ?? 0),
      avg_personal_rating: counts?.avg_personal_rating != null ? Number(counts.avg_personal_rating) : null,
      total_minutes_watched: Number(hours?.total_minutes ?? 0),
    };
  }

  static async getCharts(userId: number): Promise<ProfileCharts> {
    const [genreRows, providerRows, activityRows, statusRows, favoriteRows, ratingRows, heatmapRows] = await Promise.all([
      sql<{ genre_id: string; count: string }>`
        SELECT genre_id, COUNT(*) as count
         FROM user_library ul
         JOIN shows s ON s.id = ul.show_id
         CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(s.genres, '[]'::jsonb)) AS genre_id
         WHERE ul.user_id = ${userId}
         GROUP BY genre_id
         ORDER BY count DESC
         LIMIT 10
      `.execute(db).then((r) => r.rows),
      db
        .selectFrom('user_library as ul')
        .innerJoin('show_watch_providers as swp', 'swp.show_id', 'ul.show_id')
        .innerJoin('watch_providers as wp', 'wp.id', 'swp.provider_id')
        .select([
          'wp.name',
          'wp.logo_path',
          sql<string>`COUNT(DISTINCT ul.show_id)`.as('count'),
        ])
        .where('ul.user_id', '=', userId)
        .groupBy(['wp.name', 'wp.logo_path'])
        .orderBy(sql`count DESC`)
        .limit(10)
        .execute(),
      db
        .selectFrom('user_library as ul')
        .innerJoin('shows as s', 's.id', 'ul.show_id')
        .select([
          's.tmdb_id',
          's.title',
          's.media_type',
          's.poster_path',
          'ul.status',
          'ul.personal_rating',
          'ul.updated_at',
        ])
        .where('ul.user_id', '=', userId)
        .orderBy('ul.updated_at', 'desc')
        .limit(20)
        .execute(),
      db
        .selectFrom('user_library')
        .select(['status', sql<string>`COUNT(*)`.as('count')])
        .where('user_id', '=', userId)
        .groupBy('status')
        .orderBy(sql`count DESC`)
        .execute(),
      db
        .selectFrom('user_library as ul')
        .innerJoin('shows as s', 's.id', 'ul.show_id')
        .select([
          's.tmdb_id',
          's.title',
          's.media_type',
          's.poster_path',
          'ul.status',
          'ul.personal_rating',
        ])
        .where('ul.user_id', '=', userId)
        .where('ul.is_favorite', '=', true)
        .orderBy('ul.updated_at', 'desc')
        .limit(20)
        .execute(),
      sql<{ rating: string; count: string }>`
        SELECT ROUND(personal_rating)::int AS rating, COUNT(*) AS count
         FROM user_library
         WHERE user_id = ${userId} AND personal_rating IS NOT NULL AND personal_rating > 0
         GROUP BY ROUND(personal_rating)::int
         ORDER BY rating
      `.execute(db).then((r) => r.rows),
      sql<{ day: string; count: string }>`
        SELECT DATE(created_at)::text AS day, COUNT(*) AS count
         FROM activity_log
         WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '365 days'
         GROUP BY DATE(created_at)
         ORDER BY day
      `.execute(db).then((r) => r.rows),
    ]);

    return {
      genres: genreRows.map((r) => ({ genreId: Number(r.genre_id), count: Number(r.count) })),
      providers: providerRows.map((r) => ({ name: r.name, logoPath: r.logo_path, count: Number(r.count) })),
      activity: activityRows.map((r) => ({
        tmdb_id: r.tmdb_id,
        title: r.title,
        media_type: r.media_type,
        poster_path: r.poster_path,
        status: r.status,
        personal_rating: r.personal_rating,
        updated_at: typeof r.updated_at === 'string' ? r.updated_at : (r.updated_at as Date).toISOString(),
      })),
      statuses: statusRows.map((r) => ({ status: r.status, count: Number(r.count) })),
      favorites: favoriteRows.map((r) => ({
        tmdb_id: r.tmdb_id,
        title: r.title,
        media_type: r.media_type,
        poster_path: r.poster_path,
        status: r.status,
        personal_rating: r.personal_rating,
      })),
      ratingDistribution: ratingRows.map((r) => ({ rating: Number(r.rating), count: Number(r.count) })),
      heatmap: heatmapRows.map((r) => ({ day: r.day, count: Number(r.count) })),
    };
  }
}
