import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { db } from '@/lib/db';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { UserSearchSchema } from '@/server/validators/query-params.validator';

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = v.safeParse(UserSearchSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.issues[0].message }, { status: 400 });
    }
    const { q } = parsed.output;

    const users = await db
      .selectFrom('users')
      .select((eb) => [
        'users.id',
        'users.username',
        'users.profile_picture_url',
        eb
          .exists(
            eb
              .selectFrom('follows')
              .select('followed_id')
              .whereRef('follows.followed_id', '=', 'users.id')
              .where('follows.follower_id', '=', user.userId)
          )
          .as('isFollowing'),
      ])
      .where('users.username', 'ilike', `%${q}%`)
      .where('users.id', '!=', user.userId)
      .limit(10)
      .execute();

    const result = users.map((u) => ({ ...u, isFollowing: Boolean(u.isFollowing) }));

    return NextResponse.json({ success: true, users: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
