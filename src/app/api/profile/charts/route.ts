import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { ProfileService } from '@/server/services/profile.service';

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const charts = await ProfileService.getCharts(user.userId);
    return NextResponse.json({ success: true, ...charts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
