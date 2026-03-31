import { queryOne, queryMany } from '@/lib/db';

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
    const result = await queryOne<AIRecommendation>(
      `INSERT INTO ai_recommendations (user_id, conversation_id, recommended_show_id, recommendation_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, conversationId || null, recommendedShowId, recommendationType]
    );
    if (!result) throw new Error('Failed to log recommendation');
    return result;
  }

  static async updateFeedback(
    id: number,
    feedback: UserFeedback
  ): Promise<AIRecommendation | null> {
    return queryOne<AIRecommendation>(
      `UPDATE ai_recommendations SET user_feedback = $1 WHERE id = $2 RETURNING *`,
      [feedback, id]
    );
  }

  static async getByUser(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<AIRecommendation[]> {
    return queryMany<AIRecommendation>(
      `SELECT * FROM ai_recommendations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
  }

  static async getByConversation(
    conversationId: number
  ): Promise<AIRecommendation[]> {
    return queryMany<AIRecommendation>(
      `SELECT * FROM ai_recommendations
       WHERE conversation_id = $1
       ORDER BY created_at DESC`,
      [conversationId]
    );
  }

  static async getRecommendationStats(userId: number): Promise<{
    total: number;
    liked: number;
    disliked: number;
    neutral: number;
    byType: Record<RecommendationType, number>;
  }> {
    const result = await queryOne<any>(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN user_feedback = 'liked' THEN 1 END) as liked,
        COUNT(CASE WHEN user_feedback = 'disliked' THEN 1 END) as disliked,
        COUNT(CASE WHEN user_feedback = 'neutral' THEN 1 END) as neutral,
        COUNT(CASE WHEN recommendation_type = 'simple' THEN 1 END) as simple_count,
        COUNT(CASE WHEN recommendation_type = 'conversational' THEN 1 END) as conversational_count,
        COUNT(CASE WHEN recommendation_type = 'discussion' THEN 1 END) as discussion_count,
        COUNT(CASE WHEN recommendation_type = 'mood-based' THEN 1 END) as mood_count
       FROM ai_recommendations
       WHERE user_id = $1`,
      [userId]
    );

    if (!result) {
      return {
        total: 0,
        liked: 0,
        disliked: 0,
        neutral: 0,
        byType: {
          simple: 0,
          conversational: 0,
          discussion: 0,
          'mood-based': 0,
        },
      };
    }

    return {
      total: parseInt(result.total),
      liked: parseInt(result.liked),
      disliked: parseInt(result.disliked),
      neutral: parseInt(result.neutral),
      byType: {
        simple: parseInt(result.simple_count),
        conversational: parseInt(result.conversational_count),
        discussion: parseInt(result.discussion_count),
        'mood-based': parseInt(result.mood_count),
      },
    };
  }

  static async getMostLikedRecommendations(
    userId: number,
    limit: number = 10
  ): Promise<AIRecommendation[]> {
    return queryMany<AIRecommendation>(
      `SELECT * FROM ai_recommendations
       WHERE user_id = $1 AND user_feedback = 'liked'
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
  }

  static async getSuccessRate(userId: number): Promise<number> {
    const result = await queryOne<{ rate: string }>(
      `SELECT
        COALESCE(
          ROUND(
            COUNT(CASE WHEN user_feedback = 'liked' THEN 1 END)::numeric /
            NULLIF(COUNT(*), 0) * 100,
            2
          ), 0
        ) as rate
       FROM ai_recommendations
       WHERE user_id = $1 AND user_feedback IS NOT NULL`,
      [userId]
    );
    return result ? parseFloat(result.rate) : 0;
  }
}
