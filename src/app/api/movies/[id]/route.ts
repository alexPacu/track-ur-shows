import { NextRequest, NextResponse } from 'next/server';
import { MovieService } from '@/server/services/movie.service';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';

/**
 * GET /api/movies/[id]
 * Get movie details
 * 
 * Path params:
 * - id: TMDB movie ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id);

    // validation
    if (isNaN(movieId) || movieId < 1) {
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      );
    }

    // get movie details
    const movieDetails = await MovieService.getMovieDetails(movieId);

    return NextResponse.json(
      {
        success: true,
        data: movieDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get movie details error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get movie details';

    // check if it's a 404 (movie not found)
    if (message.includes('6')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Movie not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
