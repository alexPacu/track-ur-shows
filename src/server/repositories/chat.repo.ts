import { query, queryOne, queryMany } from '@/lib/db';

export interface ChatConversation {
  id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  favorite_genres?: number[];
  favorite_networks?: number[];
  mood_preferences?: Record<string, any>;
  preferred_languages?: string[];
  watch_time_preference?: 'morning' | 'evening' | 'anytime';
  min_rating_threshold?: number;
  max_runtime_preference?: number;
  created_at: Date;
  updated_at: Date;
}

export class ChatRepository {
  static async createConversation(userId: number): Promise<ChatConversation> {
    const result = await queryOne<ChatConversation>(
      `INSERT INTO chat_conversations (user_id) VALUES ($1) RETURNING *`,
      [userId]
    );
    if (!result) throw new Error('Failed to create conversation');
    return result;
  }

  static async getConversation(id: number): Promise<ChatConversation | null> {
    return queryOne<ChatConversation>(
      `SELECT * FROM chat_conversations WHERE id = $1`,
      [id]
    );
  }

  static async getUserConversations(
    userId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatConversation[]> {
    return queryMany<ChatConversation>(
      `SELECT * FROM chat_conversations
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
  }

  static async getActiveConversation(userId: number): Promise<ChatConversation | null> {
    return queryOne<ChatConversation>(
      `SELECT * FROM chat_conversations
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId]
    );
  }

  static async closeConversation(id: number): Promise<ChatConversation | null> {
    return queryOne<ChatConversation>(
      `UPDATE chat_conversations SET is_active = FALSE WHERE id = $1 RETURNING *`,
      [id]
    );
  }

  static async addMessage(
    conversationId: number,
    role: 'user' | 'assistant',
    content: string
  ): Promise<ChatMessage> {
    const result = await queryOne<ChatMessage>(
      `INSERT INTO chat_messages (conversation_id, role, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [conversationId, role, content]
    );
    if (!result) throw new Error('Failed to add message');

    await query(
      `UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [conversationId]
    );

    return result;
  }

  static async getMessages(
    conversationId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    return queryMany<ChatMessage>(
      `SELECT * FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );
  }

  static async getPreferences(userId: number): Promise<UserPreferences | null> {
    return queryOne<UserPreferences>(
      `SELECT * FROM user_preferences WHERE user_id = $1`,
      [userId]
    );
  }

  static async createOrUpdatePreferences(
    userId: number,
    data: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const existing = await this.getPreferences(userId);

    if (!existing) {
      const result = await queryOne<UserPreferences>(
        `INSERT INTO user_preferences (
          user_id, favorite_genres, favorite_networks, mood_preferences,
          preferred_languages, watch_time_preference, min_rating_threshold,
          max_runtime_preference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          userId,
          data.favorite_genres ? JSON.stringify(data.favorite_genres) : null,
          data.favorite_networks ? JSON.stringify(data.favorite_networks) : null,
          data.mood_preferences ? JSON.stringify(data.mood_preferences) : null,
          data.preferred_languages ? JSON.stringify(data.preferred_languages) : null,
          data.watch_time_preference,
          data.min_rating_threshold,
          data.max_runtime_preference,
        ]
      );
      if (!result) throw new Error('Failed to create preferences');
      return result;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.favorite_genres !== undefined) {
      updates.push(`favorite_genres = $${paramCount++}`);
      values.push(data.favorite_genres ? JSON.stringify(data.favorite_genres) : null);
    }
    if (data.favorite_networks !== undefined) {
      updates.push(`favorite_networks = $${paramCount++}`);
      values.push(data.favorite_networks ? JSON.stringify(data.favorite_networks) : null);
    }
    if (data.mood_preferences !== undefined) {
      updates.push(`mood_preferences = $${paramCount++}`);
      values.push(data.mood_preferences ? JSON.stringify(data.mood_preferences) : null);
    }
    if (data.preferred_languages !== undefined) {
      updates.push(`preferred_languages = $${paramCount++}`);
      values.push(data.preferred_languages ? JSON.stringify(data.preferred_languages) : null);
    }
    if (data.watch_time_preference !== undefined) {
      updates.push(`watch_time_preference = $${paramCount++}`);
      values.push(data.watch_time_preference);
    }
    if (data.min_rating_threshold !== undefined) {
      updates.push(`min_rating_threshold = $${paramCount++}`);
      values.push(data.min_rating_threshold);
    }
    if (data.max_runtime_preference !== undefined) {
      updates.push(`max_runtime_preference = $${paramCount++}`);
      values.push(data.max_runtime_preference);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await queryOne<UserPreferences>(
      `UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );
    if (!result) throw new Error('Failed to update preferences');
    return result;
  }
}
