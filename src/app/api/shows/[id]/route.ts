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
      return NextResponse.json({ error: 'Invalid TV show ID' }, { status: 400 });
    }

    const showDetails = await MovieService.getShowDetails(parsed.output);

    return NextResponse.json({ success: true, data: showDetails }, { status: 200 });
  } catch (error) {
    console.error('Get TV show details error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get TV show details';

    if (message.includes('34')) {
      return NextResponse.json({ success: false, error: 'TV show not found' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
