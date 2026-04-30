import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { UserRepository } from '@/server/repositories/user.repo';
import { ProfilePutSchema } from '@/server/validators/profile.validator';
import { db } from '@/lib/db';
import { sql } from 'kysely';

async function ensureColumns() {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS background_image_url TEXT`.execute(db);
  await sql`ALTER TABLE shows ADD COLUMN IF NOT EXISTS total_episodes INTEGER`.execute(db);
  await sql`
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
  `.execute(db);
}

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureColumns();

    const profile = await UserRepository.findById(user.userId);
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [stats, hoursRow] = await Promise.all([
      sql<{
        total: string;
        watching: string;
        completed: string;
        planned: string;
        movies: string;
        tv_shows: string;
        avg_personal_rating: string | null;
      }>`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE ul.status = 'watching') AS watching,
          COUNT(*) FILTER (WHERE ul.status = 'completed') AS completed,
          COUNT(*) FILTER (WHERE ul.status = 'planning_to_watch') AS planned,
          COUNT(*) FILTER (WHERE s.media_type = 'movie') AS movies,
          COUNT(*) FILTER (WHERE s.media_type = 'tv') AS tv_shows,
          ROUND(AVG(ul.personal_rating) FILTER (WHERE ul.personal_rating IS NOT NULL), 1) AS avg_personal_rating
         FROM user_library ul
         JOIN shows s ON s.id = ul.show_id
         WHERE ul.user_id = ${user.userId}
      `.execute(db).then((r) => r.rows[0] ?? null),
      sql<{ total_minutes: string }>`
        SELECT COALESCE(SUM(
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
        ), 0) AS total_minutes
         FROM user_library ul
         JOIN shows s ON s.id = ul.show_id
         WHERE ul.user_id = ${user.userId} AND ul.status = 'completed'
      `.execute(db).then((r) => r.rows[0] ?? null),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        profile_picture_url: profile.profile_picture_url ?? null,
        background_image_url: profile.background_image_url ?? null,
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
        total_minutes_watched: Number(hoursRow?.total_minutes ?? 0),
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

    const parsed = v.safeParse(ProfilePutSchema, await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.issues[0].message }, { status: 400 });
    }
    const { profile_picture_url, background_image_url } = parsed.output;

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
