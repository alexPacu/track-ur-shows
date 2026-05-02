import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { FollowsRepository } from '@/server/repositories/follows.repo';
import { IdPathSchema } from '@/server/validators/query-params.validator';

async function resolveTarget(params: Promise<{ username: string }>) {
  const { username } = await params;
  return v.safeParse(IdPathSchema, username);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = await resolveTarget(params);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    const targetId = parsed.output;

    if (targetId === user.userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    await FollowsRepository.follow(user.userId, targetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to follow user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = await resolveTarget(params);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    const targetId = parsed.output;

    if (targetId === user.userId) {
      return NextResponse.json({ error: 'Cannot unfollow yourself' }, { status: 400 });
    }

    await FollowsRepository.unfollow(user.userId, targetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}
