import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { TMDBService } from '@/server/services/tmdb.service';
import { SeasonPathSchema } from '@/server/validators/query-params.validator';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  try {
    const { id, seasonNumber } = await params;
    const parsed = v.safeParse(SeasonPathSchema, { id, seasonNumber });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.issues[0].message }, { status: 400 });
    }
    const { id: seriesId, seasonNumber: season } = parsed.output;

    const data = await TMDBService.getTVSeasonDetails(seriesId, season);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Season details error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch season details' }, { status: 500 });
  }
}
