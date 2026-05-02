import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { UserRepository } from '@/server/repositories/user.repo';
import { FollowsRepository } from '@/server/repositories/follows.repo';
import { UsernamePathSchema } from '@/server/validators/query-params.validator';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const parsed = v.safeParse(UsernamePathSchema, username);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    const profile = await UserRepository.findByUsername(parsed.output);
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const viewer = extractUserFromRequest(req);

    const [counts, isFollowing] = await Promise.all([
      FollowsRepository.getFollowCounts(profile.id),
      viewer ? FollowsRepository.isFollowing(viewer.userId, profile.id) : Promise.resolve(false),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        username: profile.username,
        profile_picture_url: profile.profile_picture_url ?? null,
        background_image_url: profile.background_image_url ?? null,
        created_at: profile.created_at,
      },
      counts,
      isFollowing,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load profile' },
      { status: 500 }
    );
  }
}
