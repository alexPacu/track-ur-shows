import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { WatchlistService } from '@/server/services/watchlist.service';
import { validateStatus } from '@/server/validators/watchlist.validator';

const VALID_MEDIA_TYPES = ['movie', 'tv'] as const;
type MediaType = typeof VALID_MEDIA_TYPES[number];

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tmdbIdParam = searchParams.get('tmdbId');

    if (tmdbIdParam) {
      const result = await WatchlistService.checkInWatchlist(user.userId, Number(tmdbIdParam));
      return NextResponse.json({ success: true, ...result });
    }

    const watchlist = await WatchlistService.getWatchlist(user.userId);
    return NextResponse.json({ success: true, data: watchlist });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { tmdbId, mediaType, title, posterPath, backdropPath, rating, releaseDate, runtime, genres, description } = body;

    if (!tmdbId || !mediaType || !title) {
      return NextResponse.json({ error: 'tmdbId, mediaType, and title are required' }, { status: 400 });
    }

    if (!VALID_MEDIA_TYPES.includes(mediaType)) {
      return NextResponse.json({ error: 'mediaType must be "movie" or "tv"' }, { status: 400 });
    }

    const status = body.status ?? 'planning_to_watch';
    if (!validateStatus(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const entry = await WatchlistService.addToWatchlist(
      user.userId,
      Number(tmdbId),
      mediaType as MediaType,
      { title, description, posterPath, backdropPath, rating, releaseDate, runtime, genres },
      status
    );

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { tmdbId, status } = body;

    if (!tmdbId || !status) {
      return NextResponse.json({ error: 'tmdbId and status are required' }, { status: 400 });
    }

    if (!validateStatus(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const updated = await WatchlistService.updateStatus(user.userId, Number(tmdbId), status);
    if (!updated) return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tmdbId = Number(searchParams.get('tmdbId'));

    if (!tmdbId) return NextResponse.json({ error: 'tmdbId is required' }, { status: 400 });

    const removed = await WatchlistService.removeFromWatchlist(user.userId, tmdbId);
    if (!removed) return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
