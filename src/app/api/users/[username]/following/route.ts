import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { UserRepository } from '@/server/repositories/user.repo';
import { FollowsRepository } from '@/server/repositories/follows.repo';
import { PageSchema, UsernamePathSchema } from '@/server/validators/query-params.validator';

const PAGE_SIZE = 20;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const usernameParsed = v.safeParse(UsernamePathSchema, username);
    if (!usernameParsed.success) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    const profile = await UserRepository.findByUsername(usernameParsed.output);
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const pageParsed = v.safeParse(v.object({ page: PageSchema }), raw);
    if (!pageParsed.success) {
      return NextResponse.json({ error: pageParsed.issues[0].message }, { status: 400 });
    }
    const { page } = pageParsed.output;
    const offset = (page - 1) * PAGE_SIZE;

    const rows = await FollowsRepository.getFollowing(profile.id, { limit: PAGE_SIZE + 1, offset });
    const hasMore = rows.length > PAGE_SIZE;
    const following = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    return NextResponse.json({ success: true, following, hasMore });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load following' },
      { status: 500 }
    );
  }
}
