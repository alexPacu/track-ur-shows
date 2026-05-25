import { ShowRepository, SeasonRepository } from '@/server/repositories/movie.repo';
import { WatchlistRepository, UserLibraryEntry, UserLibraryWithShow } from '@/server/repositories/watchlist.repo';
import { TMDBService } from './tmdb.service';

export class WatchlistService {
  static async getWatchlist(userId: number): Promise<UserLibraryWithShow[]> {
    return WatchlistRepository.getByUser(userId);
  }

  static async addToWatchlist(
    userId: number,
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    showData: {
      title: string;
      description?: string;
      posterPath?: string;
      backdropPath?: string;
      rating?: number;
      releaseDate?: string;
      runtime?: number;
      genres?: number[];
    },
    status: string = 'planning_to_watch'
  ): Promise<UserLibraryEntry> {
    let runtime = showData.runtime;
    let totalEpisodes: number | undefined;

    // nincs runtime adat soooo apit hivjad
    if (runtime == null || mediaType === 'tv') {
      try {
        if (mediaType === 'movie') {
          const details = await TMDBService.getMovieDetails(tmdbId);
          runtime = runtime ?? (details as any).runtime ?? undefined;
        } else {
          const details = await TMDBService.getTVShowDetails(tmdbId);
          const ert = (details as any).episode_run_time;
          if (runtime == null) runtime = Array.isArray(ert) && ert.length > 0 ? ert[0] : undefined;
          totalEpisodes = (details as any).number_of_episodes ?? undefined;
        }
      } catch {
        // nincs runtime
      }
    }

    const show = await ShowRepository.findOrCreateByTmdbId(tmdbId, {
      title: showData.title,
      description: showData.description,
      media_type: mediaType,
      genres: showData.genres,
      rating: showData.rating,
      release_date: showData.releaseDate ? new Date(showData.releaseDate) : undefined,
      poster_path: showData.posterPath,
      backdrop_path: showData.backdropPath,
      runtime,
      total_episodes: totalEpisodes,
    });

    return WatchlistRepository.add(userId, show.id, status);
  }

  static async updateStatus(userId: number, tmdbId: number, status: string): Promise<{ success: boolean; current_season?: number; current_episode?: number }> {
    const entry = await WatchlistRepository.findByUserAndTmdbId(userId, tmdbId);
    if (!entry) return { success: false };
    const updated = await WatchlistRepository.updateStatus(userId, entry.show_id, status);
    if (!updated) return { success: false };

    if (status !== 'completed' && entry.media_type === 'tv') {
      await WatchlistRepository.clearProgress(userId, entry.show_id);
      return { success: true, current_season: null as any, current_episode: null as any };
    }

    if (status === 'completed' && entry.media_type === 'tv') {
      let lastSeason = await WatchlistRepository.getLastSeason(entry.show_id);

      if (!lastSeason) {
        try {
          const showDetails = await TMDBService.getTVShowDetails(tmdbId);
          const seasons = ((showDetails as any).seasons || []).filter((s: any) => s.season_number > 0 && s.episode_count > 0);
          if (seasons.length > 0) {
            await Promise.all(
              seasons.map((s: any) =>
                SeasonRepository.findOrCreate(entry.show_id, s.season_number, {
                  episode_count: s.episode_count,
                  air_date: s.air_date ? new Date(s.air_date) : undefined,
                  poster_path: s.poster_path,
                })
              )
            );
            const last = seasons[seasons.length - 1];
            lastSeason = { season_number: last.season_number, episode_count: last.episode_count };
          }
        } catch {
          // TMDB unavailable, proceed without setting progress
        }
      }

      if (lastSeason) {
        await WatchlistRepository.updateProgress(userId, entry.show_id, lastSeason.season_number, lastSeason.episode_count);
        return { success: true, current_season: lastSeason.season_number, current_episode: lastSeason.episode_count };
      }
    }

    return { success: true };
  }

  static async removeFromWatchlist(userId: number, tmdbId: number): Promise<boolean> {
    const entry = await WatchlistRepository.findByUserAndTmdbId(userId, tmdbId);
    if (!entry) return false;
    return WatchlistRepository.remove(userId, entry.show_id);
  }

  static async updateFavorite(userId: number, tmdbId: number, isFavorite: boolean): Promise<boolean> {
    const entry = await WatchlistRepository.findByUserAndTmdbId(userId, tmdbId);
    if (!entry) return false;
    const updated = await WatchlistRepository.updateFavorite(userId, entry.show_id, isFavorite);
    return updated !== null;
  }

  static async updateProgress(userId: number, tmdbId: number, season: number, episode: number): Promise<boolean> {
    const entry = await WatchlistRepository.findByUserAndTmdbId(userId, tmdbId);
    if (!entry) return false;
    const updated = await WatchlistRepository.updateProgress(userId, entry.show_id, season, episode);
    return updated !== null;
  }

  static async updateRating(userId: number, tmdbId: number, rating: number | null): Promise<boolean> {
    const entry = await WatchlistRepository.findByUserAndTmdbId(userId, tmdbId);
    if (!entry) return false;
    const updated = await WatchlistRepository.updateRating(userId, entry.show_id, rating);
    return updated !== null;
  }

  static async checkInWatchlist(userId: number, tmdbId: number): Promise<{ inWatchlist: boolean; status?: string }> {
    const entry = await WatchlistRepository.findByUserAndTmdbId(userId, tmdbId);
    if (!entry) return { inWatchlist: false };
    return { inWatchlist: true, status: entry.status };
  }
}
