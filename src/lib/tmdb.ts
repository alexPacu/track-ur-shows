/**
 * TMDB API HTTP Client
 * handles all communication with TMDB API
 * uses Bearer token authentication
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

interface TMDBConfig {
  bearerToken: string;
}

interface TMDBSearchResult {
  page: number;
  results: any[];
  total_pages: number;
  total_results: number;
}

interface TMDBErrorResponse {
  status_code: number;
  status_message: string;
}

class TMDBClient {
  private bearerToken: string;

  constructor(config: TMDBConfig) {
    if (!config.bearerToken) {
      throw new Error('TMDB Bearer token is required');
    }
    this.bearerToken = config.bearerToken;
  }

  /**
   * Make authenticated request to TMDB API
   * @param endpoint - API endpoint path ('/search/movie')
   * @param params - Query parameters
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    try {
      const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            url.searchParams.append(key, value.join(','));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as TMDBErrorResponse;
        throw new Error(
          `TMDB API Error (${errorData.status_code}): ${errorData.status_message}`
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      console.error(`TMDB Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async searchMovies(
    query: string,
    options: {
      page?: number;
      language?: string;
      includeAdult?: boolean;
      region?: string;
    } = {}
  ): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/search/movie', {
      query,
      page: options.page || 1,
      language: options.language || 'en-US',
      include_adult: options.includeAdult || false,
      region: options.region,
    });
  }

  async getMovieDetails(
    movieId: number,
    options: {
      language?: string;
      appendToResponse?: string[];
    } = {}
  ) {
    return this.request(`/movie/${movieId}`, {
      language: options.language || 'en-US',
      append_to_response: options.appendToResponse
        ? options.appendToResponse.join(',')
        : 'videos,credits,images',
    });
  }

  async searchTVShows(
    query: string,
    options: {
      page?: number;
      language?: string;
      includeAdult?: boolean;
    } = {}
  ): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/search/tv', {
      query,
      page: options.page || 1,
      language: options.language || 'en-US',
      include_adult: options.includeAdult || false,
    });
  }

  async getTVShowDetails(
    seriesId: number,
    options: {
      language?: string;
      appendToResponse?: string[];
    } = {}
  ) {
    return this.request(`/tv/${seriesId}`, {
      language: options.language || 'en-US',
      append_to_response: options.appendToResponse
        ? options.appendToResponse.join(',')
        : 'videos,credits,images',
    });
  }

  async getTrendingMovies(
    timeWindow: 'day' | 'week' = 'day',
    options: { language?: string } = {}
  ): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>(`/trending/movie/${timeWindow}`, {
      language: options.language || 'en-US',
    });
  }

  async getTrendingTV(
    timeWindow: 'day' | 'week' = 'day',
    options: { language?: string } = {}
  ): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>(`/trending/tv/${timeWindow}`, {
      language: options.language || 'en-US',
    });
  }

  async getPopularMovies(
    options: {
      page?: number;
      language?: string;
      region?: string;
    } = {}
  ): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/movie/popular', {
      page: options.page || 1,
      language: options.language || 'en-US',
      region: options.region,
    });
  }

  async getPopularTV(
    options: {
      page?: number;
      language?: string;
    } = {}
  ): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/tv/popular', {
      page: options.page || 1,
      language: options.language || 'en-US',
    });
  }

  async getTopRatedMovies(
    options: {
      page?: number;
      language?: string;
      region?: string;
    } = {}
  ): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/movie/top_rated', {
      page: options.page || 1,
      language: options.language || 'en-US',
      region: options.region,
    });
  }

  async getTopRatedTV(
    options: {
      page?: number;
      language?: string;
    } = {}
  ): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/tv/top_rated', {
      page: options.page || 1,
      language: options.language || 'en-US',
    });
  }

  async getTVSeasonDetails(
    seriesId: number,
    seasonNumber: number,
    options: { language?: string } = {}
  ) {
    return this.request(`/tv/${seriesId}/season/${seasonNumber}`, {
      language: options.language || 'en-US',
    });
  }

  async discoverMovies(
    options: {
      page?: number;
      language?: string;
      with_genres?: string;
      with_watch_providers?: string;
      watch_region?: string;
      sort_by?: string;
    } = {}
  ): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/discover/movie', {
      page: options.page || 1,
      language: options.language || 'en-US',
      with_genres: options.with_genres,
      with_watch_providers: options.with_watch_providers,
      watch_region: options.watch_region || 'US',
      sort_by: options.sort_by || 'popularity.desc',
    });
  }

  async discoverTV(
    options: {
      page?: number;
      language?: string;
      with_genres?: string;
      with_watch_providers?: string;
      watch_region?: string;
      sort_by?: string;
    } = {}
  ): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/discover/tv', {
      page: options.page || 1,
      language: options.language || 'en-US',
      with_genres: options.with_genres,
      with_watch_providers: options.with_watch_providers,
      watch_region: options.watch_region || 'US',
      sort_by: options.sort_by || 'popularity.desc',
    });
  }

  async findByExternalId(
    externalId: string,
    externalSource:
      | 'imdb_id'
      | 'tvdb_id'
      | 'wikidata_id'
      | 'facebook_id'
      | 'instagram_id'
      | 'twitter_id' = 'imdb_id'
  ) {
    return this.request(`/find/${externalId}`, {
      external_source: externalSource,
    });
  }
}

/**
 * initialize TMDB client with API key from environment
 */
export function createTMDBClient(): TMDBClient {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY environment variable is not set');
  }

  return new TMDBClient({ bearerToken: apiKey });
}

/**
 * Build image URL from TMDB path
 * @param path - Image path from TMDB (e.g., '/1E5baAaEse26fej7uHcjOgEE2t2.jpg')
 * @param size - Image size (e.g., 'w500', 'original')
 */
export function buildImageUrl(path: string | null, size: string = 'w500'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

/**
 *  image sizes
 */
export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original',
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original',
  },
  still: {
    small: 'w185',
    medium: 'w300',
    original: 'original',
  },
  profile: {
    small: 'w185',
    medium: 'h632',
    original: 'original',
  },
};

export type { TMDBSearchResult };
