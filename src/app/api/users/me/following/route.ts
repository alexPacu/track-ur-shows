import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { FollowsRepository } from '@/server/repositories/follows.repo';

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const following = await FollowsRepository.getFollowing(user.userId);
    return NextResponse.json({ success: true, following });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load following' },
      { status: 500 }
    );
  }
}
