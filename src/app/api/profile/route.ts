import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { UserRepository } from '@/server/repositories/user.repo';
import { query, queryOne } from '@/lib/db';

async function ensureColumns() {
  await query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS background_image_url TEXT
  `);
  await query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'profile_picture_url'
        AND data_type = 'character varying'
      ) THEN
        ALTER TABLE users ALTER COLUMN profile_picture_url TYPE TEXT;
      END IF;
    END $$
  `);
}

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureColumns();

    const profile = await UserRepository.findById(user.userId);
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const stats = await queryOne<{
      total: string;
      watching: string;
      completed: string;
      planned: string;
      movies: string;
      tv_shows: string;
      avg_personal_rating: string | null;
    }>(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE ul.status = 'watching') AS watching,
        COUNT(*) FILTER (WHERE ul.status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE ul.status = 'planning_to_watch') AS planned,
        COUNT(*) FILTER (WHERE s.media_type = 'movie') AS movies,
        COUNT(*) FILTER (WHERE s.media_type = 'tv') AS tv_shows,
        ROUND(AVG(ul.personal_rating) FILTER (WHERE ul.personal_rating IS NOT NULL), 1) AS avg_personal_rating
       FROM user_library ul
       JOIN shows s ON s.id = ul.show_id
       WHERE ul.user_id = $1`,
      [user.userId]
    );

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        profile_picture_url: profile.profile_picture_url ?? null,
        background_image_url: profile.background_image_url ?? null,
        bio: profile.bio ?? null,
        created_at: profile.created_at,
      },
      stats: {
        total: Number(stats?.total ?? 0),
        watching: Number(stats?.watching ?? 0),
        completed: Number(stats?.completed ?? 0),
        planned: Number(stats?.planned ?? 0),
        movies: Number(stats?.movies ?? 0),
        tv_shows: Number(stats?.tv_shows ?? 0),
        avg_personal_rating: stats?.avg_personal_rating != null ? Number(stats.avg_personal_rating) : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureColumns();

    const body = await req.json();
    const { profile_picture_url, background_image_url } = body;

    if (profile_picture_url && profile_picture_url.length > 3_000_000) {
      return NextResponse.json({ error: 'Profile picture too large (max ~2 MB)' }, { status: 400 });
    }
    if (background_image_url && background_image_url.length > 6_000_000) {
      return NextResponse.json({ error: 'Background image too large (max ~4 MB)' }, { status: 400 });
    }

    await UserRepository.update(user.userId, {
      ...(profile_picture_url !== undefined ? { profile_picture_url } : {}),
      ...(background_image_url !== undefined ? { background_image_url } : {}),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
