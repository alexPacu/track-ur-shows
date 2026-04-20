import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { WatchlistService } from '@/server/services/watchlist.service';
import { validateStatus } from '@/server/validators/watchlist.validator';
import { query } from '@/lib/db';

function logActivity(userId: number, tmdbId: number, action: string): void {
  query(
    'INSERT INTO activity_log (user_id, tmdb_id, action) VALUES ($1, $2, $3)',
    [userId, tmdbId, action]
  ).catch(() => {});
}

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

    logActivity(user.userId, Number(tmdbId), 'added');
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
    const { tmdbId, status, rating, current_season, current_episode, is_favorite } = body;

    if (!tmdbId) {
      return NextResponse.json({ error: 'tmdbId is required' }, { status: 400 });
    }

    if (status === undefined && rating === undefined && current_season === undefined && current_episode === undefined && is_favorite === undefined) {
      return NextResponse.json({ error: 'status, rating, progress, or is_favorite is required' }, { status: 400 });
    }

    if (status !== undefined) {
      if (!validateStatus(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      const result = await WatchlistService.updateStatus(user.userId, Number(tmdbId), status);
      if (!result.success) return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
      logActivity(user.userId, Number(tmdbId), 'status_change');
      if (result.current_season !== undefined) {
        return NextResponse.json({ success: true, current_season: result.current_season, current_episode: result.current_episode });
      }
    }

    if (current_season !== undefined || current_episode !== undefined) {
      const s = Number(current_season);
      const e = Number(current_episode);
      if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1 || e < 1) {
        return NextResponse.json({ error: 'current_season and current_episode must be positive integers' }, { status: 400 });
      }
      const updated = await WatchlistService.updateProgress(user.userId, Number(tmdbId), s, e);
      if (!updated) return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
      logActivity(user.userId, Number(tmdbId), 'progress');
    }

    if (is_favorite !== undefined) {
      const updated = await WatchlistService.updateFavorite(user.userId, Number(tmdbId), Boolean(is_favorite));
      if (!updated) return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
      logActivity(user.userId, Number(tmdbId), 'favorite');
    }

    if (rating !== undefined) {
      const ratingValue = rating === null ? null : Number(rating);
      if (ratingValue !== null && (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10)) {
        return NextResponse.json({ error: 'Rating must be between 0 and 10' }, { status: 400 });
      }
      const updated = await WatchlistService.updateRating(user.userId, Number(tmdbId), ratingValue);
      if (!updated) return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
      logActivity(user.userId, Number(tmdbId), 'rating');
    }

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

    logActivity(user.userId, tmdbId, 'removed');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
