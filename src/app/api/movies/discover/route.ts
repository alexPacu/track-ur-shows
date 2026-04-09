import { NextRequest, NextResponse } from 'next/server';
import { TMDBService } from '@/server/services/tmdb.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'movie';
    const with_genres = searchParams.get('with_genres') || undefined;
    const with_watch_providers = searchParams.get('with_watch_providers') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);

    const data =
      type === 'tv'
        ? await TMDBService.discoverTV({ with_genres, with_watch_providers, page })
        : await TMDBService.discoverMovies({ with_genres, with_watch_providers, page });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Discover route error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch discover results' }, { status: 500 });
  }
}
