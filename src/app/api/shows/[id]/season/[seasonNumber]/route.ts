import { NextRequest, NextResponse } from 'next/server';
import { TMDBService } from '@/server/services/tmdb.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  try {
    const { id, seasonNumber } = await params;
    const seriesId = parseInt(id);
    const season = parseInt(seasonNumber);

    if (isNaN(seriesId) || isNaN(season)) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const data = await TMDBService.getTVSeasonDetails(seriesId, season);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Season details error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch season details' }, { status: 500 });
  }
}
