import { db } from '@/lib/db';

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
    const result = await db
      .insertInto('chat_conversations')
      .values({ user_id: userId })
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as unknown as ChatConversation;
  }

  static async getConversation(id: number): Promise<ChatConversation | null> {
    const result = await db.selectFrom('chat_conversations').selectAll().where('id', '=', id).executeTakeFirst();
    return result ? (result as unknown as ChatConversation) : null;
  }

  static async getUserConversations(userId: number, limit: number = 20, offset: number = 0): Promise<ChatConversation[]> {
    const rows = await db
      .selectFrom('chat_conversations')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
    return rows as unknown as ChatConversation[];
  }

  static async getActiveConversation(userId: number): Promise<ChatConversation | null> {
    const result = await db
      .selectFrom('chat_conversations')
      .selectAll()
      .where('user_id', '=', userId)
      .where('is_active', '=', true)
      .orderBy('updated_at', 'desc')
      .limit(1)
      .executeTakeFirst();
    return result ? (result as unknown as ChatConversation) : null;
  }

  static async closeConversation(id: number): Promise<ChatConversation | null> {
    const result = await db
      .updateTable('chat_conversations')
      .set({ is_active: false })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as ChatConversation) : null;
  }

  static async addMessage(conversationId: number, role: 'user' | 'assistant', content: string): Promise<ChatMessage> {
    const message = await db
      .insertInto('chat_messages')
      .values({ conversation_id: conversationId, role, content })
      .returningAll()
      .executeTakeFirstOrThrow();

    await db
      .updateTable('chat_conversations')
      .set({ updated_at: new Date() })
      .where('id', '=', conversationId)
      .execute();

    return message as unknown as ChatMessage;
  }

  static async getMessages(conversationId: number, limit: number = 100, offset: number = 0): Promise<ChatMessage[]> {
    const rows = await db
      .selectFrom('chat_messages')
      .selectAll()
      .where('conversation_id', '=', conversationId)
      .orderBy('created_at', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();
    return rows as unknown as ChatMessage[];
  }

  static async getPreferences(userId: number): Promise<UserPreferences | null> {
    const result = await db.selectFrom('user_preferences').selectAll().where('user_id', '=', userId).executeTakeFirst();
    return result ? (result as unknown as UserPreferences) : null;
  }

  static async createOrUpdatePreferences(userId: number, data: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = await this.getPreferences(userId);

    if (!existing) {
      const result = await db
        .insertInto('user_preferences')
        .values({
          user_id: userId,
          favorite_genres: data.favorite_genres ? JSON.stringify(data.favorite_genres) : null,
          favorite_networks: data.favorite_networks ? JSON.stringify(data.favorite_networks) : null,
          mood_preferences: data.mood_preferences ? JSON.stringify(data.mood_preferences) : null,
          preferred_languages: data.preferred_languages ? JSON.stringify(data.preferred_languages) : null,
          watch_time_preference: data.watch_time_preference ?? null,
          min_rating_threshold: data.min_rating_threshold ?? null,
          max_runtime_preference: data.max_runtime_preference ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return result as unknown as UserPreferences;
    }

    const updates: Record<string, unknown> = {};
    if (data.favorite_genres !== undefined) updates.favorite_genres = data.favorite_genres ? JSON.stringify(data.favorite_genres) : null;
    if (data.favorite_networks !== undefined) updates.favorite_networks = data.favorite_networks ? JSON.stringify(data.favorite_networks) : null;
    if (data.mood_preferences !== undefined) updates.mood_preferences = data.mood_preferences ? JSON.stringify(data.mood_preferences) : null;
    if (data.preferred_languages !== undefined) updates.preferred_languages = data.preferred_languages ? JSON.stringify(data.preferred_languages) : null;
    if (data.watch_time_preference !== undefined) updates.watch_time_preference = data.watch_time_preference;
    if (data.min_rating_threshold !== undefined) updates.min_rating_threshold = data.min_rating_threshold;
    if (data.max_runtime_preference !== undefined) updates.max_runtime_preference = data.max_runtime_preference;
    if (Object.keys(updates).length === 0) return existing;
    updates.updated_at = new Date();

    const result = await db
      .updateTable('user_preferences')
      .set(updates as any)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst();
    if (!result) throw new Error('Failed to update preferences');
    return result as unknown as UserPreferences;
  }
}
