import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { UserRepository } from '@/server/repositories/user.repo';
import { ProfileService } from '@/server/services/profile.service';
import { UsernamePathSchema } from '@/server/validators/query-params.validator';

export async function GET(
  _req: NextRequest,
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

    const stats = await ProfileService.getStats(profile.id);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load stats' },
      { status: 500 }
    );
  }
}
