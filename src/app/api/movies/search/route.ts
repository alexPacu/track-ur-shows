import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { MovieService } from '@/server/services/movie.service';
import { SearchQuerySchema } from '@/server/validators/query-params.validator';

export async function GET(req: NextRequest) {
  try {
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = v.safeParse(SearchQuerySchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.issues[0].message }, { status: 400 });
    }
    const { query, page, type } = parsed.output;

    const results = type === 'tv'
      ? await MovieService.searchShows(query, { page })
      : await MovieService.searchMovies(query, { page });

    return NextResponse.json({ success: true, data: results }, { status: 200 });
  } catch (error) {
    console.error('Search movies error:', error);
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
