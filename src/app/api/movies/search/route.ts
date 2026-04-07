import { NextRequest, NextResponse } from 'next/server';
import { MovieService } from '@/server/services/movie.service';

/**
 * GET /api/movies/search
 * Search for movies
 * 
 * Query params:
 * - query (required): Search query string
 * - page (optional): Page number (default: 1)
 * - type (optional): 'movie' or 'tv' (default: 'movie')
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query')?.trim();
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const type = (searchParams.get('type') || 'movie') as 'movie' | 'tv';

    // validation
    if (!query || query.length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (page < 1 || page > 500) {
      return NextResponse.json(
        { error: 'Page must be between 1 and 500' },
        { status: 400 }
      );
    }

    // search movies
    const results = await MovieService.searchMovies(query, { page });

    return NextResponse.json(
      {
        success: true,
        data: results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Search movies error:', error);
    const message = error instanceof Error ? error.message : 'Search failed';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
