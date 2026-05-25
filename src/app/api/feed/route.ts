import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { db } from '@/lib/db';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { PageSchema } from '@/server/validators/query-params.validator';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = v.safeParse(v.object({ page: PageSchema }), raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.issues[0].message }, { status: 400 });
    }
    const { page } = parsed.output;
    const offset = (page - 1) * PAGE_SIZE;

    const followedIds = db
      .selectFrom('follows')
      .select('followed_id')
      .where('follower_id', '=', user.userId);

    const rows = await db
      .selectFrom('activity_log as al')
      .innerJoin('users as u', 'u.id', 'al.user_id')
      .leftJoin('shows as s', 's.tmdb_id', 'al.tmdb_id')
      .select([
        'al.id',
        'al.user_id',
        'al.action',
        'al.created_at',
        'al.tmdb_id',
        'u.username',
        'u.profile_picture_url',
        's.title',
        's.poster_path',
        's.media_type',
      ])
      .where('al.user_id', 'in', followedIds)
      .where('al.action', '!=', 'removed')
      .orderBy('al.created_at', 'desc')
      .limit(PAGE_SIZE + 1)
      .offset(offset)
      .execute();

    const hasMore = rows.length > PAGE_SIZE;
    const feed = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    return NextResponse.json({ success: true, feed, hasMore });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load feed' },
      { status: 500 }
    );
  }
}
