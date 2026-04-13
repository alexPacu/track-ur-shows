import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { WatchProgressRepository } from '@/server/repositories/watch-progress.repo';

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
    const body = await req.json();
    const {
      tmdbId,
      mediaType,
      season,
      episode,
      progressSeconds,
      durationSeconds,
      progressPercent,
      title,
      posterPath,
      backdropPath,
      completed,
    } = body;

    if (!tmdbId || !mediaType || (mediaType !== 'movie' && mediaType !== 'tv')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // treat >=92% as completed so it drops off the continue-watching row
    const autoCompleted =
      completed === true || (typeof progressPercent === 'number' && progressPercent >= 92);

    const saved = await WatchProgressRepository.upsert({
      userId: user.userId,
      tmdbId: Number(tmdbId),
      mediaType,
      season: season ? Number(season) : 0,
      episode: episode ? Number(episode) : 0,
      progressSeconds: progressSeconds ? Math.floor(Number(progressSeconds)) : 0,
      durationSeconds: durationSeconds ? Math.floor(Number(durationSeconds)) : 0,
      progressPercent: typeof progressPercent === 'number' ? progressPercent : 0,
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
    const tmdbId = Number(searchParams.get('tmdbId'));
    const mediaType = searchParams.get('mediaType') as 'movie' | 'tv' | null;
    const season = Number(searchParams.get('season') ?? 0);
    const episode = Number(searchParams.get('episode') ?? 0);

    if (!tmdbId || !mediaType) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await WatchProgressRepository.deleteEntry(user.userId, tmdbId, mediaType, season, episode);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to delete watch progress';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
