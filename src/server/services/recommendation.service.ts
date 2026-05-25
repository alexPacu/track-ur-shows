import { db } from '@/lib/db';
import { sql } from 'kysely';
import { ShowRepository } from '@/server/repositories/movie.repo';
import { RecommendationRepository } from '@/server/repositories/recommendations.repo';
import { TMDBService } from './tmdb.service';

type MediaType = 'movie' | 'tv';

interface RecommendationOptions {
  type?: MediaType;
  limit?: number;
}

interface SeedEntry {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  weight: number;
}

const MAX_SEEDS = 15;
const RECOMMENDATION_TTL_DAYS = 7;

export class RecommendationService {
  static async getRecommendations(userId: number, options: RecommendationOptions = {}) {
    try {
      const limit = options.limit ?? 20;
      const weightExpr = sql<number>`
        (
          CASE ul.status
            WHEN 'completed' THEN 1.2
            WHEN 'watching' THEN 1.0
            WHEN 'planning_to_watch' THEN 0.6
            WHEN 'paused' THEN 0.4
            WHEN 'dropped' THEN 0.2
            ELSE 0.5
          END
        ) * (1 + COALESCE(ul.personal_rating, s.rating, 0) / 10.0)
      `;

      let seedQuery = db
        .selectFrom('user_library as ul')
        .innerJoin('shows as s', 's.id', 'ul.show_id')
        .select([
          's.tmdb_id',
          's.media_type',
          's.title',
          weightExpr.as('weight'),
          'ul.updated_at',
        ])
        .where('ul.user_id', '=', userId);

      if (options.type) {
        seedQuery = seedQuery.where('s.media_type', '=', options.type);
      }

      const seedRows = await seedQuery
        .orderBy(weightExpr, 'desc')
        .orderBy('ul.updated_at', 'desc')
        .execute();

      const seeds = seedRows.map((row) => ({
        tmdb_id: row.tmdb_id,
        media_type: row.media_type,
        title: row.title,
        weight: Number((row as any).weight ?? 0),
      })) as SeedEntry[];

      if (seeds.length === 0) {
        return { movies: [], tv: [], genresUsed: [] };
      }

      const libraryRows = await db
        .selectFrom('user_library as ul')
        .innerJoin('shows as s', 's.id', 'ul.show_id')
        .select(['s.tmdb_id', 's.media_type'])
        .where('ul.user_id', '=', userId)
        .execute();

      const movieIds = new Set<number>();
      const tvIds = new Set<number>();
      for (const row of libraryRows) {
        if (row.media_type === 'movie') movieIds.add(row.tmdb_id);
        if (row.media_type === 'tv') tvIds.add(row.tmdb_id);
      }

      const recentCutoff = new Date(Date.now() - RECOMMENDATION_TTL_DAYS * 24 * 60 * 60 * 1000);
      const recentRows = await db
        .selectFrom('ai_recommendations as ar')
        .innerJoin('shows as s', 's.id', 'ar.recommended_show_id')
        .select(['s.tmdb_id', 's.media_type'])
        .where('ar.user_id', '=', userId)
        .where('ar.recommendation_type', '=', 'simple')
        .where('ar.created_at', '>=', recentCutoff)
        .execute();

      for (const row of recentRows) {
        if (row.media_type === 'movie') movieIds.add(row.tmdb_id);
        if (row.media_type === 'tv') tvIds.add(row.tmdb_id);
      }

      const dayKey = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
      const rotateSeeds = (list: SeedEntry[]) => {
        if (list.length <= 1) return list;
        const offset = (userId + dayKey) % list.length;
        return list.slice(offset).concat(list.slice(0, offset));
      };

      const movieSeeds = rotateSeeds(seeds.filter((s) => s.media_type === 'movie')).slice(0, MAX_SEEDS);
      const tvSeeds = rotateSeeds(seeds.filter((s) => s.media_type === 'tv')).slice(0, MAX_SEEDS);

      const logRecommendations = async (items: any[]) => {
        await Promise.all(
          items.map(async (item) => {
            const tmdbId = Number(item?.id);
            if (!Number.isFinite(tmdbId)) return;
            const mediaType: MediaType = item?.media_type === 'tv' ? 'tv' : 'movie';
            const title = item?.title ?? item?.name ?? 'Untitled';
            const releaseDate = item?.release_date ?? item?.first_air_date;
            const show = await ShowRepository.findOrCreateByTmdbId(tmdbId, {
              title,
              description: item?.overview,
              media_type: mediaType,
              genres: Array.isArray(item?.genre_ids) ? item.genre_ids : [],
              rating: item?.vote_average,
              release_date: releaseDate ? new Date(releaseDate) : undefined,
              poster_path: item?.poster_path,
              backdrop_path: item?.backdrop_path,
            });
            await RecommendationRepository.logRecommendation(userId, show.id, 'simple');
          })
        );
      };

      const buildRoundRobin = async (seedList: SeedEntry[], excludeIds: Set<number>) => {
        if (seedList.length === 0 || limit <= 0) return [];
        const quota = Math.ceil(limit / seedList.length);
        const fetched = await Promise.all(
          seedList.map(async (seed) => {
            try {
              const data = seed.media_type === 'movie'
                ? await TMDBService.getMovieRecommendations(seed.tmdb_id, { page: 1 })
                : await TMDBService.getTVRecommendations(seed.tmdb_id, { page: 1 });
              return { seed, items: data.results ?? [] };
            } catch (error) {
              console.warn(
                `[Recommendations] Failed to fetch seed ${seed.media_type}:${seed.tmdb_id}`,
                error
              );
              return { seed, items: [] };
            }
          })
        );

        const indices = new Map<number, number>();
        const counts = new Map<number, number>();
        const seen = new Set<number>();
        const results: any[] = [];

        let added = true;
        while (results.length < limit && added) {
          added = false;
          for (let i = 0; i < fetched.length; i += 1) {
            if (results.length >= limit) break;
            const used = counts.get(i) ?? 0;
            if (used >= quota) continue;

            const items = fetched[i].items;
            let idx = indices.get(i) ?? 0;
            while (idx < items.length) {
              const item = items[idx];
              idx += 1;
              const id = Number(item?.id);
              if (!Number.isFinite(id)) continue;
              if (excludeIds.has(id) || seen.has(id)) continue;

              seen.add(id);
              counts.set(i, used + 1);
              results.push({
                ...item,
                reason: `Because you watched ${fetched[i].seed.title}`,
              });
              added = true;
              break;
            }
            indices.set(i, idx);
          }
        }

        return results;
      };

      if (options.type === 'movie') {
        const movies = await buildRoundRobin(movieSeeds, movieIds);
        await logRecommendations(movies);
        return { movies, tv: [], genresUsed: [] };
      }

      if (options.type === 'tv') {
        const tv = await buildRoundRobin(tvSeeds, tvIds);
        await logRecommendations(tv);
        return { movies: [], tv, genresUsed: [] };
      }

      const [movies, tv] = await Promise.all([
        buildRoundRobin(movieSeeds, movieIds),
        buildRoundRobin(tvSeeds, tvIds),
      ]);

      await Promise.all([logRecommendations(movies), logRecommendations(tv)]);
      return { movies, tv, genresUsed: [] };
    } catch (error) {
      console.error('RecommendationService.getRecommendations error:', error);
      throw error;
    }
  }
}
