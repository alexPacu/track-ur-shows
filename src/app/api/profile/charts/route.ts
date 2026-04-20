import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { queryMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [genreRows, providerRows, activityRows, statusRows, favoriteRows, ratingRows, heatmapRows] = await Promise.all([
      queryMany<{ genre_id: string; count: string }>(
        `SELECT genre_id, COUNT(*) as count
         FROM user_library ul
         JOIN shows s ON s.id = ul.show_id
         CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(s.genres, '[]'::jsonb)) AS genre_id
         WHERE ul.user_id = $1
         GROUP BY genre_id
         ORDER BY count DESC
         LIMIT 10`,
        [user.userId]
      ),
      queryMany<{ name: string; logo_path: string | null; count: string }>(
        `SELECT wp.name, wp.logo_path, COUNT(DISTINCT ul.show_id) as count
         FROM user_library ul
         JOIN show_watch_providers swp ON swp.show_id = ul.show_id
         JOIN watch_providers wp ON wp.id = swp.provider_id
         WHERE ul.user_id = $1
         GROUP BY wp.name, wp.logo_path
         ORDER BY count DESC
         LIMIT 10`,
        [user.userId]
      ),
      queryMany<{
        tmdb_id: number;
        title: string;
        media_type: string;
        poster_path: string | null;
        status: string;
        personal_rating: number | null;
        updated_at: string;
      }>(
        `SELECT s.tmdb_id, s.title, s.media_type, s.poster_path, ul.status, ul.personal_rating, ul.updated_at
         FROM user_library ul
         JOIN shows s ON s.id = ul.show_id
         WHERE ul.user_id = $1
         ORDER BY ul.updated_at DESC
         LIMIT 20`,
        [user.userId]
      ),
      queryMany<{ status: string; count: string }>(
        `SELECT ul.status, COUNT(*) as count
         FROM user_library ul
         WHERE ul.user_id = $1
         GROUP BY ul.status
         ORDER BY count DESC`,
        [user.userId]
      ),
      queryMany<{
        tmdb_id: number;
        title: string;
        media_type: string;
        poster_path: string | null;
        status: string;
        personal_rating: number | null;
      }>(
        `SELECT s.tmdb_id, s.title, s.media_type, s.poster_path, ul.status, ul.personal_rating
         FROM user_library ul
         JOIN shows s ON s.id = ul.show_id
         WHERE ul.user_id = $1 AND ul.is_favorite = true
         ORDER BY ul.updated_at DESC
         LIMIT 20`,
        [user.userId]
      ),
      queryMany<{ rating: string; count: string }>(
        `SELECT ROUND(personal_rating)::int AS rating, COUNT(*) AS count
         FROM user_library
         WHERE user_id = $1 AND personal_rating IS NOT NULL AND personal_rating > 0
         GROUP BY ROUND(personal_rating)::int
         ORDER BY rating`,
        [user.userId]
      ),
      queryMany<{ day: string; count: string }>(
        `SELECT DATE(created_at)::text AS day, COUNT(*) AS count
         FROM activity_log
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '365 days'
         GROUP BY DATE(created_at)
         ORDER BY day`,
        [user.userId]
      ),
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
