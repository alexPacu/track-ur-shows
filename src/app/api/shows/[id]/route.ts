import { NextRequest, NextResponse } from 'next/server';
import { MovieService } from '@/server/services/movie.service';

/**
 * GET /api/shows/[id]
 * Get TV show details
 * 
 * Path params:
 * - id: TMDB TV show ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const showId = parseInt(id);

    // validation
    if (isNaN(showId) || showId < 1) {
      return NextResponse.json(
        { error: 'Invalid TV show ID' },
        { status: 400 }
      );
    }

    // get TV show details
    const showDetails = await MovieService.getShowDetails(showId);

    return NextResponse.json(
      {
        success: true,
        data: showDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get TV show details error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get TV show details';

    // check if it's a 404 (show not found)
    if (message.includes('34')) {
      return NextResponse.json(
        {
          success: false,
          error: 'TV show not found',
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
