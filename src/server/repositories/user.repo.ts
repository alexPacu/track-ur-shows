import { db } from '@/lib/db';

export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  profile_picture_url?: string | null;
  background_image_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserStats {
  id: number;
  user_id: number;
  total_shows_watched: number;
  total_episodes_watched: number;
  total_hours_watched: number;
  average_rating?: number;
  updated_at: Date;
}

export class UserRepository {
  static async create(email: string, username: string, passwordHash: string): Promise<User> {
    const user = await db
      .insertInto('users')
      .values({ email, username, password_hash: passwordHash })
      .returningAll()
      .executeTakeFirstOrThrow();

    await db.insertInto('user_stats').values({ user_id: user.id }).execute();

    return user as unknown as User;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
    return (result as unknown as User) ?? null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await db.selectFrom('users').selectAll().where('email', '=', email).executeTakeFirst();
    return (result as unknown as User) ?? null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await db.selectFrom('users').selectAll().where('username', '=', username).executeTakeFirst();
    return (result as unknown as User) ?? null;
  }

  static async update(id: number, data: Partial<User>): Promise<User | null> {
    const updates: Record<string, unknown> = {};
    if (data.profile_picture_url !== undefined) updates.profile_picture_url = data.profile_picture_url;
    if (data.background_image_url !== undefined) updates.background_image_url = data.background_image_url;
    if (Object.keys(updates).length === 0) return this.findById(id);
    updates.updated_at = new Date();
    const result = await db
      .updateTable('users')
      .set(updates as any)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as User) : null;
  }

  static async getStats(userId: number): Promise<UserStats | null> {
    const result = await db.selectFrom('user_stats').selectAll().where('user_id', '=', userId).executeTakeFirst();
    return result ? (result as unknown as UserStats) : null;
  }

  static async updateStats(userId: number, data: Partial<UserStats>): Promise<UserStats | null> {
    const updates: Record<string, unknown> = {};
    if (data.total_shows_watched !== undefined) updates.total_shows_watched = data.total_shows_watched;
    if (data.total_episodes_watched !== undefined) updates.total_episodes_watched = data.total_episodes_watched;
    if (data.total_hours_watched !== undefined) updates.total_hours_watched = data.total_hours_watched;
    if (data.average_rating !== undefined) updates.average_rating = data.average_rating;
    updates.updated_at = new Date();
    const result = await db
      .updateTable('user_stats')
      .set(updates as any)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return result ? (result as unknown as UserStats) : null;
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await db.deleteFrom('users').where('id', '=', id).execute();
    return (result?.numDeletedRows ?? 0n) > 0n;
  }
}
