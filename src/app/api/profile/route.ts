import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { UserRepository } from '@/server/repositories/user.repo';
import { ProfileService } from '@/server/services/profile.service';
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

    const stats = await ProfileService.getStats(user.userId);

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
      stats,
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
