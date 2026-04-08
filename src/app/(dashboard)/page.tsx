'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MediaCard } from '@/components/MediaCard';
import { TrendingIcon, CalendarIcon } from '@/components/Icons';

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  poster_url?: string;
  backdrop_path?: string;
  backdrop_url?: string;
  vote_average?: number;
  genres?: { id: number; name: string }[] | number[];
  overview?: string;
  genre_ids?: number[];
}

export default function HomePage() {
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [newReleases, setNewReleases] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendingRes, newRes] = await Promise.all([
          fetch('/api/movies/trending?timeWindow=week'),
          fetch('/api/movies/popular?page=1'),
        ]);

        if (trendingRes.ok) {
          const data = await trendingRes.json();
          setTrendingMovies(data.data?.results?.slice(0, 4) || []);
        }

        if (newRes.ok) {
          const data = await newRes.json();
          setNewReleases(data.data?.results?.slice(0, 4) || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const featuredMovie = trendingMovies[0];
  const hasTrending = trendingMovies.length > 0;
  const hasNewReleases = newReleases.length > 0;

  return (
    <div className="pb-20">
      {featuredMovie && (
        <section className="relative mx-auto mt-6 h-[500px] max-w-7xl overflow-hidden rounded-2xl border border-accent-blue/25">
          <div className="absolute inset-0">
            {featuredMovie.backdrop_url ? (
              <Image
                src={featuredMovie.backdrop_url}
                alt={featuredMovie.title || featuredMovie.name || ''}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-accent-blue/20 to-bg-dark"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/50 to-transparent"></div>
          </div>

          <div className="relative flex h-full items-center px-8">
            <div className="max-w-xl">
              <div className="inline-block px-3 py-1 bg-accent-blue/20 text-accent-blue rounded-full text-sm font-semibold mb-4">
                Featured
              </div>

              <h1 className="text-5xl font-bold text-text-primary mb-4">
                {featuredMovie.title || featuredMovie.name}
              </h1>

              <p className="text-text-muted mb-6 line-clamp-2">
                {featuredMovie.overview}
              </p>

              {featuredMovie.vote_average && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-accent-blue">
                      {featuredMovie.vote_average.toFixed(1)}
                    </span>
                    <span className="text-text-muted">/10</span>
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <button className="rounded-xl bg-accent-blue px-8 py-3 font-semibold text-bg-dark shadow-[0_8px_20px_rgba(137,207,240,0.2)] hover:-translate-y-0.5 hover:bg-blue-300">
                  Watch Now
                </button>
                <button className="rounded-xl border border-accent-blue px-8 py-3 font-semibold text-accent-blue hover:-translate-y-0.5 hover:bg-accent-blue/10">
                  Add to Watchlist
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-3 gap-6 mb-14">
          <div className="modern-panel rounded-xl p-5">
            <p className="text-text-muted text-sm">Trending This Week</p>
            <p className="mt-1 text-3xl font-bold text-accent-blue">{trendingMovies.length}</p>
          </div>
          <div className="modern-panel rounded-xl p-5">
            <p className="text-text-muted text-sm">Fresh Releases Loaded</p>
            <p className="mt-1 text-3xl font-bold text-blue-300">{newReleases.length}</p>
          </div>
          <div className="modern-panel rounded-xl p-5">
            <p className="text-text-muted text-sm">Dashboard Status</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">Live and ready</p>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-2">
          <TrendingIcon className="w-6 h-6 text-accent-blue" />
          <h2 className="text-3xl font-bold text-text-primary">Trending Now</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-bg-card rounded-lg h-64 animate-pulse"></div>
            ))}
          </div>
        ) : hasTrending ? (
          <div className="grid grid-cols-4 gap-6">
            {trendingMovies.map((movie) => (
              <MediaCard
                key={movie.id}
                id={movie.id}
                type="movie"
                title={movie.title || movie.name || 'Untitled'}
                posterUrl={movie.poster_url || movie.poster_path}
                rating={movie.vote_average}
                genres={
                  Array.isArray(movie.genres)
                    ? movie.genres.map((g: any) => g.name || g)
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="modern-panel rounded-xl p-9 text-center">
            <p className="font-semibold text-text-primary">No trending items available right now.</p>
            <p className="mt-2 text-sm text-text-muted">
              Check your API configuration or refresh in a minute.
            </p>
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-6 py-4">
        <div className="mb-8 mt-2 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-accent-blue" />
          <h2 className="text-3xl font-bold text-text-primary">New Releases</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-bg-card rounded-lg h-64 animate-pulse"></div>
            ))}
          </div>
        ) : hasNewReleases ? (
          <div className="grid grid-cols-4 gap-6">
            {newReleases.map((movie) => (
              <MediaCard
                key={movie.id}
                id={movie.id}
                type="movie"
                title={movie.title || movie.name || 'Untitled'}
                posterUrl={movie.poster_url || movie.poster_path}
                rating={movie.vote_average}
                genres={
                  Array.isArray(movie.genres)
                    ? movie.genres.map((g: any) => g.name || g)
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="modern-panel rounded-xl p-9 text-center">
            <p className="font-semibold text-text-primary">No new releases found.</p>
            <p className="mt-2 text-sm text-text-muted">The endpoint returned an empty response.</p>
          </div>
        )}
      </section>
    </div>
  );
}
