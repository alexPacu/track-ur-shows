import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { FollowsRepository } from '@/server/repositories/follows.repo';
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

    const rows = await FollowsRepository.getFollowers(user.userId, { limit: PAGE_SIZE + 1, offset });
    const hasMore = rows.length > PAGE_SIZE;
    const followers = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    return NextResponse.json({ success: true, followers, hasMore });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load followers' },
      { status: 500 }
    );
  }
}
