import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { TMDBService } from '@/server/services/tmdb.service';
import { DiscoverQuerySchema } from '@/server/validators/query-params.validator';

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = v.safeParse(DiscoverQuerySchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.issues[0].message }, { status: 400 });
    }
    const { type, with_genres, with_watch_providers, page } = parsed.output;

    const data = type === 'tv'
      ? await TMDBService.discoverTV({ with_genres, with_watch_providers, page })
      : await TMDBService.discoverMovies({ with_genres, with_watch_providers, page });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Discover route error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch discover results' }, { status: 500 });
  }
}
