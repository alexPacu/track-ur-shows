import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { RecommendationService } from '@/server/services/recommendation.service';
import { RecommendationsQuerySchema } from '@/server/validators/query-params.validator';

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = v.safeParse(RecommendationsQuerySchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.issues[0].message }, { status: 400 });
    }
    const { type, limit } = parsed.output;

    const data = await RecommendationService.getRecommendations(user.userId, { type, limit });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Recommendations route error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch recommendations';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
