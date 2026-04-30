import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { WatchProgressRepository } from '@/server/repositories/watch-progress.repo';
import { WatchProgressPostSchema, WatchProgressDeleteSchema } from '@/server/validators/watch-progress.validator';

export async function GET(req: NextRequest) {
  const user = extractUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const items = await WatchProgressRepository.listContinueWatching(user.userId);
    return NextResponse.json({ success: true, data: items });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load continue watching';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = extractUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = v.safeParse(WatchProgressPostSchema, await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.issues[0].message }, { status: 400 });
    }
    const { tmdbId, mediaType, season, episode, progressSeconds, durationSeconds, progressPercent, title, posterPath, backdropPath, completed } = parsed.output;

    // treat >=92% as completed so it drops off the continue-watching row
    const autoCompleted =
      completed === true || (typeof progressPercent === 'number' && progressPercent >= 92);

    const saved = await WatchProgressRepository.upsert({
      userId: user.userId,
      tmdbId,
      mediaType,
      season: season ?? 0,
      episode: episode ?? 0,
      progressSeconds: progressSeconds !== undefined ? Math.floor(progressSeconds) : 0,
      durationSeconds: durationSeconds !== undefined ? Math.floor(durationSeconds) : 0,
      progressPercent: progressPercent ?? 0,
      title,
      posterPath,
      backdropPath,
      completed: autoCompleted,
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to save watch progress';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = extractUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const parsed = v.safeParse(WatchProgressDeleteSchema, Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.issues[0].message }, { status: 400 });
    }
    const { tmdbId, mediaType, season, episode } = parsed.output;

    await WatchProgressRepository.deleteEntry(user.userId, tmdbId, mediaType, season, episode);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to delete watch progress';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
