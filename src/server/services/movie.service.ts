import { TMDBService } from './tmdb.service';
import { ShowRepository } from '@/server/repositories/movie.repo';

/**
 * handles TMDB API calls and caching to database
 */
export class MovieService {
  static async searchMovies(query: string, options: { page?: number } = {}) {
    try {
      const results = await TMDBService.searchMovies(query, {
        page: options.page || 1,
        type: 'movie',
      });

      // cache results in database
      const cachedShows = await Promise.all(
        results.results
          .slice(0, 5)
          .map((movie: any) =>
            ShowRepository.findOrCreateByTmdbId(movie.id, {
              title: movie.title,
              description: movie.overview,
              media_type: 'movie',
              genres: movie.genre_ids || [],
              rating: movie.vote_average,
              release_date: movie.release_date
                ? new Date(movie.release_date)
                : undefined,
              poster_path: movie.poster_path,
              backdrop_path: movie.backdrop_path,
              runtime: movie.runtime,
            })
          )
      );

      return {
        ...results,
        cached: true,
      };
    } catch (error) {
      console.error('MovieService.searchMovies error:', error);
      throw error;
    }
  }

  static async searchShows(query: string, options: { page?: number } = {}) {
    try {
      const results = await TMDBService.searchMovies(query, {
        page: options.page || 1,
        type: 'tv',
      });

      const cachedShows = await Promise.all(
        results.results
          .slice(0, 5)
          .map((show: any) =>
            ShowRepository.findOrCreateByTmdbId(show.id, {
              title: show.name,
              description: show.overview,
              media_type: 'tv',
              genres: show.genre_ids || [],
              rating: show.vote_average,
              release_date: show.first_air_date
                ? new Date(show.first_air_date)
                : undefined,
              poster_path: show.poster_path,
              backdrop_path: show.backdrop_path,
            })
          )
      );

      return {
        ...results,
        cached: true,
      };
    } catch (error) {
      console.error('MovieService.searchShows error:', error);
      throw error;
    }
  }

  /**
   *  cacheimg
   * - Check database first - if found, return it (no API call)
   * - If not found - call TMDB API, cache it, return data
   */
  static async getMovieDetails(tmdbId: number) {
    try {
      const cachedMovie = await ShowRepository.findByTmdbId(tmdbId);
      if (cachedMovie) {
        console.log(`Movie ${tmdbId} found in cache - returning from DB`);
        return cachedMovie;
      }

      console.log(`Movie ${tmdbId} not in cache - calling TMDB API`);
      const movieDetails = await TMDBService.getMovieDetails(tmdbId);

      const genres = movieDetails.genres?.map((g: any) => g.id) || [];
      const cached = await ShowRepository.findOrCreateByTmdbId(tmdbId, {
        title: movieDetails.title,
        description: movieDetails.overview,
        media_type: 'movie',
        genres,
        rating: movieDetails.vote_average,
        release_date: movieDetails.release_date
          ? new Date(movieDetails.release_date)
          : undefined,
        poster_path: movieDetails.poster_path,
        backdrop_path: movieDetails.backdrop_path,
        runtime: movieDetails.runtime,
      });

      return {
        ...movieDetails,
        db_id: cached.id,
      };
    } catch (error) {
      console.error('MovieService.getMovieDetails error:', error);
      throw error;
    }
  }

  static async getPopularMovies(options: { page?: number } = {}) {
    try {
      const cached = await ShowRepository.getByMediaType('movie', 20, 0);
      if (cached.length > 0) {
        console.log(`Retrieved ${cached.length} popular movies from cache`);
        return { results: cached, from_cache: true };
      }

      const results = await TMDBService.getPopularMovies({
        page: options.page || 1,
      });

      await Promise.all(
        results.results.map((movie: any) =>
          ShowRepository.findOrCreateByTmdbId(movie.id, {
            title: movie.title,
            description: movie.overview,
            media_type: 'movie',
            genres: movie.genre_ids || [],
            rating: movie.vote_average,
            release_date: movie.release_date
              ? new Date(movie.release_date)
              : undefined,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
          })
        )
      );

      return {
        ...results,
        from_cache: false,
      };
    } catch (error) {
      console.error('MovieService.getPopularMovies error:', error);
      throw error;
    }
  }

  static async getTrendingMovies(timeWindow: 'day' | 'week' = 'day') {
    try {
      const results = await TMDBService.getTrendingMovies(timeWindow);

      await Promise.all(
        results.results
          .slice(0, 10)
          .map((movie: any) =>
            ShowRepository.findOrCreateByTmdbId(movie.id, {
              title: movie.title,
              description: movie.overview,
              media_type: 'movie',
              genres: movie.genre_ids || [],
              rating: movie.vote_average,
              release_date: movie.release_date
                ? new Date(movie.release_date)
                : undefined,
              poster_path: movie.poster_path,
              backdrop_path: movie.backdrop_path,
            })
          )
      );

      return results;
    } catch (error) {
      console.error('MovieService.getTrendingMovies error:', error);
      throw error;
    }
  }

  /**
    *  caching logic yet again but fur tv shows:
   */
  static async getShowDetails(showId: number) {
    try {
      const cachedShow = await ShowRepository.findByTmdbId(showId);
      if (cachedShow) {
        console.log(`TV Show ${showId} found in cache - returning from DB`);
        return cachedShow;
      }

      console.log(`TV Show ${showId} not in cache - calling TMDB API`);
      const showDetails = await TMDBService.getTVShowDetails(showId);

      const genres = showDetails.genres?.map((g: any) => g.id) || [];
      const cached = await ShowRepository.findOrCreateByTmdbId(showId, {
        title: showDetails.name,
        description: showDetails.overview,
        media_type: 'tv',
        genres,
        rating: showDetails.vote_average,
        release_date: showDetails.first_air_date
          ? new Date(showDetails.first_air_date)
          : undefined,
        poster_path: showDetails.poster_path,
        backdrop_path: showDetails.backdrop_path,
      });

      return {
        ...showDetails,
        db_id: cached.id,
      };
    } catch (error) {
      console.error('MovieService.getShowDetails error:', error);
      throw error;
    }
  }

  static async getTrendingShows(timeWindow: 'day' | 'week' = 'day') {
    try {
      const results = await TMDBService.getTrendingTV(timeWindow);

      await Promise.all(
        results.results
          .slice(0, 10)
          .map((show: any) =>
            ShowRepository.findOrCreateByTmdbId(show.id, {
              title: show.name,
              description: show.overview,
              media_type: 'tv',
              genres: show.genre_ids || [],
              rating: show.vote_average,
              release_date: show.first_air_date
                ? new Date(show.first_air_date)
                : undefined,
              poster_path: show.poster_path,
              backdrop_path: show.backdrop_path,
            })
          )
      );

      return results;
    } catch (error) {
      console.error('MovieService.getTrendingShows error:', error);
      throw error;
    }
  }

  static async getPopularShows(options: { page?: number } = {}) {
    try {
      const cached = await ShowRepository.getByMediaType('tv', 20, 0);
      if (cached.length > 0) {
        console.log(`Retrieved ${cached.length} popular TV shows from cache`);
        return { results: cached, from_cache: true };
      }

      const results = await TMDBService.getPopularTV({
        page: options.page || 1,
      });

      await Promise.all(
        results.results.map((show: any) =>
          ShowRepository.findOrCreateByTmdbId(show.id, {
            title: show.name,
            description: show.overview,
            media_type: 'tv',
            genres: show.genre_ids || [],
            rating: show.vote_average,
            release_date: show.first_air_date
              ? new Date(show.first_air_date)
              : undefined,
            poster_path: show.poster_path,
            backdrop_path: show.backdrop_path,
          })
        )
      );

      return {
        ...results,
        from_cache: false,
      };
    } catch (error) {
      console.error('MovieService.getPopularShows error:', error);
      throw error;
    }
  }
}
