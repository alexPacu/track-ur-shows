import { createTMDBClient, buildImageUrl } from '@/lib/tmdb';

/**
 * 
 * handles API calls and data transformation
 */
export class TMDBService {
  private static client = createTMDBClient();

  static async searchMovies(
    query: string,
    options: { page?: number; includeAdult?: boolean; type?: 'movie' | 'tv' } = {}
  ) {
    try {
      const type = options.type || 'movie';
      const result = (
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

      // transform results to include full image URLs
      return {
        ...result,
        results: result.results.map((item: any) => ({
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
      const movie = (await this.client.getMovieDetails(movieId, {
        appendToResponse: ['videos', 'credits', 'images', 'watch_providers'],
      })) as any;

      return {
        ...movie,
        media_type: 'movie',
        poster_url: buildImageUrl(movie.poster_path, 'w500'),
        backdrop_url: buildImageUrl(movie.backdrop_path, 'w1280'),
        genres: movie.genres || [],
        credits: movie.credits || { cast: [], crew: [] },
        videos: movie.videos?.results || [],
        images: movie.images || { backdrops: [], posters: [], logos: [] },
        watch_providers: movie.watch?.providers || {},
      };
    } catch (error) {
      console.error('TMDBService.getMovieDetails error:', error);
      throw error;
    }
  }

  static async getTVShowDetails(seriesId: number) {
    try {
      const show = (await this.client.getTVShowDetails(seriesId, {
        appendToResponse: ['videos', 'credits', 'images', 'watch_providers'],
      })) as any;

      return {
        ...show,
        media_type: 'tv',
        poster_url: buildImageUrl(show.poster_path, 'w500'),
        backdrop_url: buildImageUrl(show.backdrop_path, 'w1280'),
        genres: show.genres || [],
        credits: show.credits || { cast: [], crew: [] },
        videos: show.videos?.results || [],
        images: show.images || { backdrops: [], posters: [], logos: [] },
        watch_providers: show.watch?.providers || {},
      };
    } catch (error) {
      console.error('TMDBService.getTVShowDetails error:', error);
      throw error;
    }
  }

  static async getTrendingMovies(timeWindow: 'day' | 'week' = 'day') {
    try {
      const result = (await this.client.getTrendingMovies(timeWindow)) as any;

      return {
        ...result,
        results: result.results.map((item: any) => ({
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
      const result = (await this.client.getTrendingTV(timeWindow)) as any;

      return {
        ...result,
        results: result.results.map((item: any) => ({
          ...item,
          media_type: 'tv',
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.getTrendingTV error:', error);
      throw error;
    }
  }

  static async getPopularMovies(options: { page?: number } = {}) {
    try {
      const result = (await this.client.getPopularMovies({
        page: options.page || 1,
      })) as any;

      return {
        ...result,
        results: result.results.map((item: any) => ({
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
      const result = (await this.client.getPopularTV({
        page: options.page || 1,
      })) as any;

      return {
        ...result,
        results: result.results.map((item: any) => ({
          ...item,
          media_type: 'tv',
          poster_url: buildImageUrl(item.poster_path, 'w342'),
          backdrop_url: buildImageUrl(item.backdrop_path, 'w780'),
        })),
      };
    } catch (error) {
      console.error('TMDBService.getPopularTV error:', error);
      throw error;
    }
  }

  static async getTopRatedMovies(options: { page?: number } = {}) {
    try {
      const result = (await this.client.getTopRatedMovies({
        page: options.page || 1,
      })) as any;

      return {
        ...result,
        results: result.results.map((item: any) => ({
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
      const result = (await this.client.getTopRatedTV({
        page: options.page || 1,
      })) as any;

      return {
        ...result,
        results: result.results.map((item: any) => ({
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
      const result = (await this.client.discoverMovies({
        page: options.page || 1,
        with_genres: options.with_genres,
        with_watch_providers: options.with_watch_providers,
      })) as any;

      return {
        ...result,
        results: result.results.map((item: any) => ({
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
      const result = (await this.client.discoverTV({
        page: options.page || 1,
        with_genres: options.with_genres,
        with_watch_providers: options.with_watch_providers,
      })) as any;

      return {
        ...result,
        results: result.results.map((item: any) => ({
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
