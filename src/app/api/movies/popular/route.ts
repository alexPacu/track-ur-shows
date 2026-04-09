import { NextRequest, NextResponse } from 'next/server';
import { MovieService } from '@/server/services/movie.service';

/**
 * GET /api/movies/popular
 * Get popular movies or TV shows
 *
 * Query params:
 * - page (optional): Page number 1-500 (default: 1)
 * - type (optional): 'movie' or 'tv' (default: 'movie')
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const type = (searchParams.get('type') || 'movie') as 'movie' | 'tv';

    if (page < 1 || page > 500) {
      return NextResponse.json(
        { success: false, error: 'Page must be between 1 and 500' },
        { status: 400 }
      );
    }

    const results = type === 'tv'
      ? await MovieService.getPopularShows({ page })
      : await MovieService.getPopularMovies({ page });

    return NextResponse.json(
      { success: true, data: results },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get popular error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get popular';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}