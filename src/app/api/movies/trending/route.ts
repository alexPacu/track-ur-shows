import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { MovieService } from '@/server/services/movie.service';
import { TrendingQuerySchema } from '@/server/validators/query-params.validator';

export async function GET(req: NextRequest) {
  try {
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = v.safeParse(TrendingQuerySchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.issues[0].message }, { status: 400 });
    }
    const { timeWindow, type } = parsed.output;

    const results = type === 'tv'
      ? await MovieService.getTrendingShows(timeWindow)
      : await MovieService.getTrendingMovies(timeWindow);

    return NextResponse.json({ success: true, data: results }, { status: 200 });
  } catch (error) {
    console.error('Get trending error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get trending';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
