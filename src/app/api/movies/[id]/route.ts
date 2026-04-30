import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { MovieService } from '@/server/services/movie.service';
import { IdPathSchema } from '@/server/validators/query-params.validator';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = v.safeParse(IdPathSchema, id);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    const movieDetails = await MovieService.getMovieDetails(parsed.output);

    return NextResponse.json({ success: true, data: movieDetails }, { status: 200 });
  } catch (error) {
    console.error('Get movie details error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get movie details';

    if (message.includes('6')) {
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
