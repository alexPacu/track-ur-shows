import { NextRequest, NextResponse } from 'next/server';
import { MovieService } from '@/server/services/movie.service';

/**
 * GET /api/movies/trending
 * Get trending movies or TV shows
 *
 * Query params:
 * - timeWindow (optional): 'day' or 'week' (default: 'day')
 * - type (optional): 'movie' or 'tv' (default: 'movie')
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const timeWindow = (searchParams.get('timeWindow') || 'day') as 'day' | 'week';
    const type = (searchParams.get('type') || 'movie') as 'movie' | 'tv';

    if (timeWindow !== 'day' && timeWindow !== 'week') {
      return NextResponse.json(
        { success: false, error: 'timeWindow must be "day" or "week"' },
        { status: 400 }
      );
    }

    const results = type === 'tv'
      ? await MovieService.getTrendingShows(timeWindow)
      : await MovieService.getTrendingMovies(timeWindow);

    return NextResponse.json(
      { success: true, data: results },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get trending error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get trending';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}