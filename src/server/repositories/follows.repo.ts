import { db } from '@/lib/db';

export interface FollowUser {
  id: number;
  username: string;
  profile_picture_url: string | null;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

export class FollowsRepository {
  static async follow(followerId: number, followedId: number): Promise<void> {
    await db
      .insertInto('follows')
      .values({ follower_id: followerId, followed_id: followedId })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  static async unfollow(followerId: number, followedId: number): Promise<void> {
    await db
      .deleteFrom('follows')
      .where('follower_id', '=', followerId)
      .where('followed_id', '=', followedId)
      .execute();
  }

  static async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    const result = await db
      .selectFrom('follows')
      .select('follower_id')
      .where('follower_id', '=', followerId)
      .where('followed_id', '=', followedId)
      .executeTakeFirst();
    return result !== undefined;
  }

  static async getFollowing(userId: number, opts: { limit: number; offset: number }): Promise<FollowUser[]> {
    return db
      .selectFrom('follows')
      .innerJoin('users', 'users.id', 'follows.followed_id')
      .select(['users.id', 'users.username', 'users.profile_picture_url'])
      .where('follows.follower_id', '=', userId)
      .orderBy('follows.created_at', 'desc')
      .limit(opts.limit)
      .offset(opts.offset)
      .execute();
  }

  static async getFollowers(userId: number, opts: { limit: number; offset: number }): Promise<FollowUser[]> {
    return db
      .selectFrom('follows')
      .innerJoin('users', 'users.id', 'follows.follower_id')
      .select(['users.id', 'users.username', 'users.profile_picture_url'])
      .where('follows.followed_id', '=', userId)
      .orderBy('follows.created_at', 'desc')
      .limit(opts.limit)
      .offset(opts.offset)
      .execute();
  }

  static async getFollowCounts(userId: number): Promise<FollowCounts> {
    const [followersRow, followingRow] = await Promise.all([
      db
        .selectFrom('follows')
        .select((eb) => eb.fn.countAll<string>().as('count'))
        .where('followed_id', '=', userId)
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('follows')
        .select((eb) => eb.fn.countAll<string>().as('count'))
        .where('follower_id', '=', userId)
        .executeTakeFirstOrThrow(),
    ]);
    return {
      followers: Number(followersRow.count),
      following: Number(followingRow.count),
    };
  }
}
