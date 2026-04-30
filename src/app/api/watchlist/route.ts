import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { WatchlistService } from '@/server/services/watchlist.service';
import { WatchlistPostSchema, WatchlistPutSchema } from '@/server/validators/watchlist.validator';
import { IdPathSchema } from '@/server/validators/query-params.validator';
import { query } from '@/lib/db';

function logActivity(userId: number, tmdbId: number, action: string): void {
  query(
    'INSERT INTO activity_log (user_id, tmdb_id, action) VALUES ($1, $2, $3)',
    [userId, tmdbId, action]
  ).catch(() => {});
}

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tmdbIdParam = searchParams.get('tmdbId');

    if (tmdbIdParam) {
      const parsedId = v.safeParse(IdPathSchema, tmdbIdParam);
      if (!parsedId.success) {
        return NextResponse.json({ error: 'Invalid tmdbId' }, { status: 400 });
      }
      const result = await WatchlistService.checkInWatchlist(user.userId, parsedId.output);
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

    const parsed = v.safeParse(WatchlistPostSchema, await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.issues[0].message }, { status: 400 });
    }
    const { tmdbId, mediaType, title, description, posterPath, backdropPath, rating, releaseDate, runtime, genres, status } = parsed.output;

    const entry = await WatchlistService.addToWatchlist(
      user.userId,
      tmdbId,
      mediaType,
      { title, description, posterPath, backdropPath, rating, releaseDate, runtime, genres },
      status
    );

    logActivity(user.userId, tmdbId, 'added');
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

    const parsed = v.safeParse(WatchlistPutSchema, await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.issues[0].message }, { status: 400 });
    }
    const { tmdbId, status, rating, current_season, current_episode, is_favorite } = parsed.output;

    if (status !== undefined) {
      const result = await WatchlistService.updateStatus(user.userId, tmdbId, status);
      if (!result.success) return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
      logActivity(user.userId, tmdbId, 'status_change');
      if (result.current_season !== undefined) {
        return NextResponse.json({ success: true, current_season: result.current_season, current_episode: result.current_episode });
      }
    }

    if (current_season !== undefined || current_episode !== undefined) {
      if (current_season === undefined || current_episode === undefined) {
        return NextResponse.json({ error: 'current_season and current_episode must be provided together' }, { status: 400 });
      }
      const updated = await WatchlistService.updateProgress(user.userId, tmdbId, current_season, current_episode);
      if (!updated) return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
      logActivity(user.userId, tmdbId, 'progress');
    }

    if (is_favorite !== undefined) {
      const updated = await WatchlistService.updateFavorite(user.userId, tmdbId, is_favorite);
      if (!updated) return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
      logActivity(user.userId, tmdbId, 'favorite');
    }

    if (rating !== undefined) {
      const updated = await WatchlistService.updateRating(user.userId, tmdbId, rating);
      if (!updated) return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
      logActivity(user.userId, tmdbId, 'rating');
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
    const parsedId = v.safeParse(IdPathSchema, searchParams.get('tmdbId') ?? '');
    if (!parsedId.success) {
      return NextResponse.json({ error: 'tmdbId is required' }, { status: 400 });
    }
    const tmdbId = parsedId.output;

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
