import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { db } from '@/lib/db';
import { sql } from 'kysely';

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [genreRows, providerRows, activityRows, statusRows, favoriteRows, ratingRows, heatmapRows] = await Promise.all([
      sql<{ genre_id: string; count: string }>`
        SELECT genre_id, COUNT(*) as count
         FROM user_library ul
         JOIN shows s ON s.id = ul.show_id
         CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(s.genres, '[]'::jsonb)) AS genre_id
         WHERE ul.user_id = ${user.userId}
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
        .where('ul.user_id', '=', user.userId)
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
        .where('ul.user_id', '=', user.userId)
        .orderBy('ul.updated_at', 'desc')
        .limit(20)
        .execute(),
      db
        .selectFrom('user_library')
        .select(['status', sql<string>`COUNT(*)`.as('count')])
        .where('user_id', '=', user.userId)
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
        .where('ul.user_id', '=', user.userId)
        .where('ul.is_favorite', '=', true)
        .orderBy('ul.updated_at', 'desc')
        .limit(20)
        .execute(),
      sql<{ rating: string; count: string }>`
        SELECT ROUND(personal_rating)::int AS rating, COUNT(*) AS count
         FROM user_library
         WHERE user_id = ${user.userId} AND personal_rating IS NOT NULL AND personal_rating > 0
         GROUP BY ROUND(personal_rating)::int
         ORDER BY rating
      `.execute(db).then((r) => r.rows),
      sql<{ day: string; count: string }>`
        SELECT DATE(created_at)::text AS day, COUNT(*) AS count
         FROM activity_log
         WHERE user_id = ${user.userId} AND created_at >= NOW() - INTERVAL '365 days'
         GROUP BY DATE(created_at)
         ORDER BY day
      `.execute(db).then((r) => r.rows),
    ]);

    return NextResponse.json({
      success: true,
      genres: genreRows.map((r) => ({ genreId: Number(r.genre_id), count: Number(r.count) })),
      providers: providerRows.map((r) => ({ name: r.name, logoPath: r.logo_path, count: Number(r.count) })),
      activity: activityRows,
      statuses: statusRows.map((r) => ({ status: r.status, count: Number(r.count) })),
      favorites: favoriteRows,
      ratingDistribution: ratingRows.map((r) => ({ rating: Number(r.rating), count: Number(r.count) })),
      heatmap: heatmapRows.map((r) => ({ day: r.day, count: Number(r.count) })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
