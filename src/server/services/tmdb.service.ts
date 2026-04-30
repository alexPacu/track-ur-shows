import * as v from 'valibot';
import { createTMDBClient, buildImageUrl } from '@/lib/tmdb';
import {
  TMDBListResponseSchema,
  TMDBMovieDetailsSchema,
  TMDBShowDetailsSchema,
  TMDBSeasonDetailsSchema,
} from '@/server/validators/tmdb.validator';

function warnIfInvalid(result: v.SafeParseResult<v.GenericSchema>, context: string): void {
  if (!result.success) {
    console.warn(`[TMDB] ${context} validation failed: ${result.issues[0].message}`);
  }
}

export class TMDBService {
  private static client = createTMDBClient();

  static async searchMovies(
    query: string,
    options: { page?: number; includeAdult?: boolean; type?: 'movie' | 'tv' } = {}
  ) {
    try {
      const type = options.type || 'movie';
      const raw = (
        type === 'movie'
          ? await this.client.searchMovies(query, {
              page: options.page || 1,
              includeAdult: options.includeAdult || false,
            })
          : await this.client.searchTVShows(query, {
              page: options.page || 1,
              includeAdult: options.includeAdult || false,
            })
      ) as any;

      warnIfInvalid(v.safeParse(TMDBListResponseSchema, raw), 'searchMovies');

      return {
        ...raw,
        results: raw.results.map((item: any) => ({
          ...item,
          media_type: type,
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.searchMovies error:', error);
      throw error;
    }
  }

  static async getMovieDetails(movieId: number) {
    try {
      const raw = (await this.client.getMovieDetails(movieId, {
        appendToResponse: ['videos', 'credits', 'images', 'watch/providers'],
      })) as any;

      warnIfInvalid(v.safeParse(TMDBMovieDetailsSchema, raw), 'getMovieDetails');

      return {
        ...raw,
        media_type: 'movie',
        poster_url: buildImageUrl(raw.poster_path, 'w500'),
        backdrop_url: buildImageUrl(raw.backdrop_path, 'w1280'),
        genres: raw.genres || [],
        credits: raw.credits || { cast: [], crew: [] },
        videos: raw.videos?.results || [],
        images: raw.images || { backdrops: [], posters: [], logos: [] },
        watch_providers: (raw['watch/providers'] as any)?.results || {},
      };
    } catch (error) {
      console.error('TMDBService.getMovieDetails error:', error);
      throw error;
    }
  }

  static async getTVShowDetails(seriesId: number) {
    try {
      const raw = (await this.client.getTVShowDetails(seriesId, {
        appendToResponse: ['videos', 'credits', 'images', 'watch/providers'],
      })) as any;

      warnIfInvalid(v.safeParse(TMDBShowDetailsSchema, raw), 'getTVShowDetails');

      return {
        ...raw,
        media_type: 'tv',
        poster_url: buildImageUrl(raw.poster_path, 'w500'),
        backdrop_url: buildImageUrl(raw.backdrop_path, 'w1280'),
        genres: raw.genres || [],
        credits: raw.credits || { cast: [], crew: [] },
        videos: raw.videos?.results || [],
        images: raw.images || { backdrops: [], posters: [], logos: [] },
        watch_providers: (raw['watch/providers'] as any)?.results || {},
      };
    } catch (error) {
      console.error('TMDBService.getTVShowDetails error:', error);
      throw error;
    }
  }

  static async getTVSeasonDetails(seriesId: number, seasonNumber: number) {
    try {
      const raw = (await this.client.getTVSeasonDetails(seriesId, seasonNumber)) as any;

      warnIfInvalid(v.safeParse(TMDBSeasonDetailsSchema, raw), 'getTVSeasonDetails');

      return {
        ...raw,
        episodes: (raw.episodes || []).map((ep: any) => ({
          ...ep,
          still_url: buildImageUrl(ep.still_path, 'w300'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.getTVSeasonDetails error:', error);
      throw error;
    }
  }

  static async getTrendingMovies(timeWindow: 'day' | 'week' = 'day') {
    try {
      const raw = (await this.client.getTrendingMovies(timeWindow)) as any;

      warnIfInvalid(v.safeParse(TMDBListResponseSchema, raw), 'getTrendingMovies');

      return {
        ...raw,
        results: raw.results.map((item: any) => ({
          ...item,
          media_type: 'movie',
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.getTrendingMovies error:', error);
      throw error;
    }
  }

  static async getTrendingTV(timeWindow: 'day' | 'week' = 'day') {
    try {
      const raw = (await this.client.getTrendingTV(timeWindow)) as any;

      warnIfInvalid(v.safeParse(TMDBListResponseSchema, raw), 'getTrendingTV');

      return {
        ...raw,
        results: raw.results.map((item: any) => ({
          ...item,
          media_type: 'tv',
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.getTrendingShows error:', error);
      throw error;
    }
  }

  static async getPopularMovies(options: { page?: number } = {}) {
    try {
      const raw = (await this.client.getPopularMovies({ page: options.page || 1 })) as any;

      warnIfInvalid(v.safeParse(TMDBListResponseSchema, raw), 'getPopularMovies');

      return {
        ...raw,
        results: raw.results.map((item: any) => ({
          ...item,
          media_type: 'movie',
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.getPopularMovies error:', error);
      throw error;
    }
  }

  static async getPopularTV(options: { page?: number } = {}) {
    try {
      const raw = (await this.client.getPopularTV({ page: options.page || 1 })) as any;

      warnIfInvalid(v.safeParse(TMDBListResponseSchema, raw), 'getPopularTV');

      return {
        ...raw,
        results: raw.results.map((item: any) => ({
          ...item,
          media_type: 'tv',
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.getPopularShows error:', error);
      throw error;
    }
  }

  static async getTopRatedMovies(options: { page?: number } = {}) {
    try {
      const raw = (await this.client.getTopRatedMovies({ page: options.page || 1 })) as any;

      warnIfInvalid(v.safeParse(TMDBListResponseSchema, raw), 'getTopRatedMovies');

      return {
        ...raw,
        results: raw.results.map((item: any) => ({
          ...item,
          media_type: 'movie',
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.getTopRatedMovies error:', error);
      throw error;
    }
  }

  static async getTopRatedShows(options: { page?: number } = {}) {
    try {
      const raw = (await this.client.getTopRatedTV({ page: options.page || 1 })) as any;

      warnIfInvalid(v.safeParse(TMDBListResponseSchema, raw), 'getTopRatedShows');

      return {
        ...raw,
        results: raw.results.map((item: any) => ({
          ...item,
          media_type: 'tv',
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.getTopRatedShows error:', error);
      throw error;
    }
  }

  static async discoverMovies(options: { with_genres?: string; with_watch_providers?: string; page?: number } = {}) {
    try {
      const raw = (await this.client.discoverMovies({
        page: options.page || 1,
        with_genres: options.with_genres,
        with_watch_providers: options.with_watch_providers,
      })) as any;

      warnIfInvalid(v.safeParse(TMDBListResponseSchema, raw), 'discoverMovies');

      return {
        ...raw,
        results: raw.results.map((item: any) => ({
          ...item,
          media_type: 'movie',
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.discoverMovies error:', error);
      throw error;
    }
  }

  static async discoverTV(options: { with_genres?: string; with_watch_providers?: string; page?: number } = {}) {
    try {
      const raw = (await this.client.discoverTV({
        page: options.page || 1,
        with_genres: options.with_genres,
        with_watch_providers: options.with_watch_providers,
      })) as any;

      warnIfInvalid(v.safeParse(TMDBListResponseSchema, raw), 'discoverTV');

      return {
        ...raw,
        results: raw.results.map((item: any) => ({
          ...item,
          media_type: 'tv',
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.discoverTV error:', error);
      throw error;
    }
  }
}
