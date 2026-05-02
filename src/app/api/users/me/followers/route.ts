import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { FollowsRepository } from '@/server/repositories/follows.repo';

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const followers = await FollowsRepository.getFollowers(user.userId);
    return NextResponse.json({ success: true, followers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load followers' },
      { status: 500 }
    );
  }
}
