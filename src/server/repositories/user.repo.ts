import { query, queryOne } from '@/lib/db';

export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  profile_picture_url?: string;
  bio?: string;
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
  static async create(
    email: string,
    username: string,
    passwordHash: string
  ): Promise<User> {
    const result = await queryOne<User>(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email, username, passwordHash]
    );
    if (!result) throw new Error('Failed to create user');

    await query(
      `INSERT INTO user_stats (user_id) VALUES ($1)`,
      [result.id]
    );

    return result;
  }

  static async findById(id: number): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
  }

  static async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
  }

  static async findByUsername(username: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );
  }

  static async update(
    id: number,
    data: Partial<User>
  ): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.profile_picture_url !== undefined) {
      updates.push(`profile_picture_url = $${paramCount++}`);
      values.push(data.profile_picture_url);
    }
    if (data.bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(data.bio);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    return queryOne<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
  }

  static async getStats(userId: number): Promise<UserStats | null> {
    return queryOne<UserStats>(
      `SELECT * FROM user_stats WHERE user_id = $1`,
      [userId]
    );
  }

  static async updateStats(
    userId: number,
    data: Partial<UserStats>
  ): Promise<UserStats | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.total_shows_watched !== undefined) {
      updates.push(`total_shows_watched = $${paramCount++}`);
      values.push(data.total_shows_watched);
    }
    if (data.total_episodes_watched !== undefined) {
      updates.push(`total_episodes_watched = $${paramCount++}`);
      values.push(data.total_episodes_watched);
    }
    if (data.total_hours_watched !== undefined) {
      updates.push(`total_hours_watched = $${paramCount++}`);
      values.push(data.total_hours_watched);
    }
    if (data.average_rating !== undefined) {
      updates.push(`average_rating = $${paramCount++}`);
      values.push(data.average_rating);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    return queryOne<UserStats>(
      `UPDATE user_stats SET ${updates.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query(`DELETE FROM users WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
