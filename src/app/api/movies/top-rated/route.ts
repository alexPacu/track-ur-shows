import { NextRequest, NextResponse } from 'next/server';
import { TMDBService } from '@/server/services/tmdb.service';

export async function GET(request: NextRequest) {
  try {
    const type = new URL(request.url).searchParams.get('type') || 'movie';
    const data =
      type === 'tv'
        ? await TMDBService.getTopRatedShows({ page: 1 })
        : await TMDBService.getTopRatedMovies({ page: 1 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Top-rated route error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch top-rated content' }, { status: 500 });
  }
}
