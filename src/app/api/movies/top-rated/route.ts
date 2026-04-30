import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { TMDBService } from '@/server/services/tmdb.service';
import { TopRatedQuerySchema } from '@/server/validators/query-params.validator';

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = v.safeParse(TopRatedQuerySchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.issues[0].message }, { status: 400 });
    }
    const { type } = parsed.output;

    const data = type === 'tv'
      ? await TMDBService.getTopRatedShows({ page: 1 })
      : await TMDBService.getTopRatedMovies({ page: 1 });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Top-rated route error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch top-rated content' }, { status: 500 });
  }
}
