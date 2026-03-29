import { query, queryOne, queryMany } from '@/lib/db';

export interface UserReview {
  id: number;
  user_id: number;
  show_id: number;
  review_text: string;
  spoiler_flag: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserList {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ListItem {
  id: number;
  list_id: number;
  show_id: number;
  position?: number;
  added_at: Date;
}

export class ReviewRepository {
  static async create(
    userId: number,
    showId: number,
    reviewText: string,
    spoilerFlag: boolean = false
  ): Promise<UserReview> {
    const result = await queryOne<UserReview>(
      `INSERT INTO user_reviews (user_id, show_id, review_text, spoiler_flag)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, showId, reviewText, spoilerFlag]
    );
    if (!result) throw new Error('Failed to create review');
    return result;
  }

  static async findById(id: number): Promise<UserReview | null> {
    return queryOne<UserReview>(
      `SELECT * FROM user_reviews WHERE id = $1`,
      [id]
    );
  }

  static async getByUserAndShow(
    userId: number,
    showId: number
  ): Promise<UserReview | null> {
    return queryOne<UserReview>(
      `SELECT * FROM user_reviews WHERE user_id = $1 AND show_id = $2`,
      [userId, showId]
    );
  }

  static async getByShow(
    showId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserReview[]> {
    return queryMany<UserReview>(
      `SELECT * FROM user_reviews
       WHERE show_id = $1 AND spoiler_flag = FALSE
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [showId, limit, offset]
    );
  }

  static async update(
    id: number,
    reviewText: string,
    spoilerFlag: boolean
  ): Promise<UserReview | null> {
    return queryOne<UserReview>(
      `UPDATE user_reviews
       SET review_text = $1, spoiler_flag = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [reviewText, spoilerFlag, id]
    );
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM user_reviews WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export class ListRepository {
  static async create(
    userId: number,
    name: string,
    description?: string
  ): Promise<UserList> {
    const result = await queryOne<UserList>(
      `INSERT INTO user_lists (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, name, description]
    );
    if (!result) throw new Error('Failed to create list');
    return result;
  }

  static async findById(id: number): Promise<UserList | null> {
    return queryOne<UserList>(
      `SELECT * FROM user_lists WHERE id = $1`,
      [id]
    );
  }

  static async getByUser(userId: number): Promise<UserList[]> {
    return queryMany<UserList>(
      `SELECT * FROM user_lists WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );
  }

  static async update(
    id: number,
    name?: string,
    description?: string
  ): Promise<UserList | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    return queryOne<UserList>(
      `UPDATE user_lists SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM user_lists WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  static async addItem(
    listId: number,
    showId: number,
    position?: number
  ): Promise<ListItem> {
    const result = await queryOne<ListItem>(
      `INSERT INTO list_items (list_id, show_id, position)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [listId, showId, position]
    );
    if (!result) throw new Error('Failed to add item to list');
    return result;
  }

  static async getItems(
    listId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ListItem[]> {
    return queryMany<ListItem>(
      `SELECT * FROM list_items
       WHERE list_id = $1
       ORDER BY position ASC
       LIMIT $2 OFFSET $3`,
      [listId, limit, offset]
    );
  }

  static async removeItem(
    listId: number,
    showId: number
  ): Promise<boolean> {
    const result = await query(
      `DELETE FROM list_items WHERE list_id = $1 AND show_id = $2`,
      [listId, showId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  static async reorderItems(
    items: Array<{ listItemId: number; position: number }>
  ): Promise<void> {
    const values = items.flatMap(item => [item.listItemId, item.position]).slice(0, 100);
    if (values.length === 0) return;

    let query_parts = [];
    for (let i = 0; i < values.length; i += 2) {
      const paramIdx = i + 1;
      query_parts.push(`($${paramIdx}, $${paramIdx + 1})`);
    }

    await query(
      `UPDATE list_items AS t SET position = c.position
       FROM (VALUES ${query_parts.join(', ')}) AS c(id, position)
       WHERE t.id = c.id`,
      values
    );
  }
}
