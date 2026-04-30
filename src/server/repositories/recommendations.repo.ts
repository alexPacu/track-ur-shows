import { db } from '@/lib/db';
import { sql } from 'kysely';

export type RecommendationType = 'simple' | 'conversational' | 'discussion' | 'mood-based';
export type UserFeedback = 'liked' | 'disliked' | 'neutral' | null;

export interface AIRecommendation {
  id: number;
  user_id: number;
  conversation_id?: number;
  recommended_show_id: number;
  recommendation_type: RecommendationType;
  user_feedback?: UserFeedback;
  created_at: Date;
}

export class RecommendationRepository {
  static async logRecommendation(
    userId: number,
    recommendedShowId: number,
    recommendationType: RecommendationType,
    conversationId?: number
  ): Promise<AIRecommendation> {
    const result = await db
      .insertInto('ai_recommendations')
      .values({
        user_id: userId,
        conversation_id: conversationId ?? null,
        recommended_show_id: recommendedShowId,
        recommendation_type: recommendationType,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as unknown as AIRecommendation;
  }

  static async updateFeedback(id: number, feedback: UserFeedback): Promise<AIRecommendation | null> {
    const result = await db
      .updateTable('ai_recommendations')
      .set({ user_feedback: feedback })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as AIRecommendation) : null;
  }

  static async getByUser(userId: number, limit: number = 50, offset: number = 0): Promise<AIRecommendation[]> {
    const rows = await db
      .selectFrom('ai_recommendations')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
    return rows as unknown as AIRecommendation[];
  }

  static async getByConversation(conversationId: number): Promise<AIRecommendation[]> {
    const rows = await db
      .selectFrom('ai_recommendations')
      .selectAll()
      .where('conversation_id', '=', conversationId)
      .orderBy('created_at', 'desc')
      .execute();
    return rows as unknown as AIRecommendation[];
  }

  static async getRecommendationStats(userId: number): Promise<{
    total: number;
    liked: number;
    disliked: number;
    neutral: number;
    byType: Record<RecommendationType, number>;
  }> {
    const result = await sql<any>`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN user_feedback = 'liked' THEN 1 END) as liked,
        COUNT(CASE WHEN user_feedback = 'disliked' THEN 1 END) as disliked,
        COUNT(CASE WHEN user_feedback = 'neutral' THEN 1 END) as neutral,
        COUNT(CASE WHEN recommendation_type = 'simple' THEN 1 END) as simple_count,
        COUNT(CASE WHEN recommendation_type = 'conversational' THEN 1 END) as conversational_count,
        COUNT(CASE WHEN recommendation_type = 'discussion' THEN 1 END) as discussion_count,
        COUNT(CASE WHEN recommendation_type = 'mood-based' THEN 1 END) as mood_count
       FROM ai_recommendations
       WHERE user_id = ${userId}
    `.execute(db);

    const row = result.rows[0];
    if (!row) {
      return {
        total: 0,
        liked: 0,
        disliked: 0,
        neutral: 0,
        byType: { simple: 0, conversational: 0, discussion: 0, 'mood-based': 0 },
      };
    }

    return {
      total: parseInt(row.total),
      liked: parseInt(row.liked),
      disliked: parseInt(row.disliked),
      neutral: parseInt(row.neutral),
      byType: {
        simple: parseInt(row.simple_count),
        conversational: parseInt(row.conversational_count),
        discussion: parseInt(row.discussion_count),
        'mood-based': parseInt(row.mood_count),
      },
    };
  }

  static async getMostLikedRecommendations(userId: number, limit: number = 10): Promise<AIRecommendation[]> {
    const rows = await db
      .selectFrom('ai_recommendations')
      .selectAll()
      .where('user_id', '=', userId)
      .where('user_feedback', '=', 'liked')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();
    return rows as unknown as AIRecommendation[];
  }

  static async getSuccessRate(userId: number): Promise<number> {
    const result = await sql<{ rate: string }>`
      SELECT
        COALESCE(
          ROUND(
            COUNT(CASE WHEN user_feedback = 'liked' THEN 1 END)::numeric /
            NULLIF(COUNT(*), 0) * 100,
            2
          ), 0
        ) as rate
       FROM ai_recommendations
       WHERE user_id = ${userId} AND user_feedback IS NOT NULL
    `.execute(db);
    const row = result.rows[0];
    return row ? parseFloat(row.rate) : 0;
  }
}
