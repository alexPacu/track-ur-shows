import { ShowRepository } from '@/server/repositories/movie.repo';
import { WatchlistRepository, UserLibraryEntry, UserLibraryWithShow } from '@/server/repositories/watchlist.repo';

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
    const show = await ShowRepository.findOrCreateByTmdbId(tmdbId, {
      title: showData.title,
      description: showData.description,
      media_type: mediaType,
      genres: showData.genres,
      rating: showData.rating,
      release_date: showData.releaseDate ? new Date(showData.releaseDate) : undefined,
      poster_path: showData.posterPath,
      backdrop_path: showData.backdropPath,
      runtime: showData.runtime,
    });

    return WatchlistRepository.add(userId, show.id, status);
  }

  static async updateStatus(userId: number, tmdbId: number, status: string): Promise<boolean> {
    const entry = await WatchlistRepository.findByUserAndTmdbId(userId, tmdbId);
    if (!entry) return false;
    const updated = await WatchlistRepository.updateStatus(userId, entry.show_id, status);
    return updated !== null;
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
