'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_url?: string;
  backdrop_url?: string;
  vote_average?: number;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
}

interface ContinueWatchingItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  season: number;
  episode: number;
  progress_seconds: number;
  duration_seconds: number;
  progress_percent: number | string;
  title: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  last_watched_at: string;
}

function buildTmdbImage(path: string | null, size: string = 'w780') {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function ContinueWatchingCard({
  item,
  onRequestDelete,
}: {
  item: ContinueWatchingItem;
  onRequestDelete: (item: ContinueWatchingItem) => void;
}) {
  const basePath = item.media_type === 'tv' ? 'shows' : 'movies';
  const href = `/dashboard/${basePath}/${item.tmdb_id}`;

  const imageUrl =
    buildTmdbImage(item.backdrop_path, 'w780') ?? buildTmdbImage(item.poster_path, 'w500');

  const rawPct = Number(item.progress_percent) || 0;
  const derivedPct =
    rawPct > 0
      ? rawPct
      : item.duration_seconds > 0
      ? (item.progress_seconds / item.duration_seconds) * 100
      : 0;
  const percent = Math.max(0, Math.min(100, derivedPct));
  const label = item.media_type === 'tv' ? `S${item.season} · E${item.episode}` : 'Movie';

  return (
    <Link href={href} className="group/card flex-shrink-0 w-[320px]">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-accent-blue/20 hover:border-accent-blue/50 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRequestDelete(item);
          }}
          aria-label="Remove from Continue Watching"
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/55 backdrop-blur-sm text-white/90 hover:text-white hover:bg-black/75 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 focus:opacity-100 transition-opacity"
        >
          ✕
        </button>

        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title ?? 'Continue watching'}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            sizes="320px"
          />
        ) : (
          <div className="w-full h-full bg-bg-card" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/95 via-bg-dark/30 to-transparent" />

        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold text-text-muted/90 uppercase tracking-wider bg-black/30">
          {label}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-text-primary font-semibold text-base leading-tight truncate group-hover/card:text-accent-blue transition-colors">
            {item.title ?? 'Untitled'}
          </p>
          <div className="mt-2 h-1 w-full rounded-full bg-white/15 overflow-hidden">
            <div className="h-full bg-accent-blue transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function getTitle(item: MediaItem) {
  return item.title || item.name || 'Untitled';
}

function getYear(item: MediaItem) {
  const d = item.release_date || item.first_air_date;
  return d ? new Date(d).getFullYear() : null;
}

function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') =>
    ref.current?.scrollBy({ left: dir === 'right' ? 600 : -600, behavior: 'smooth' });

  return (
    <div className="relative group/scroll">
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-0 bottom-0 z-20 w-16 flex items-center justify-start pl-2 bg-gradient-to-r from-bg-dark to-transparent opacity-0 group-hover/scroll:opacity-100 transition-opacity"
      >
        <span className="w-10 h-10 rounded-full bg-bg-card border border-accent-blue/40 flex items-center justify-center text-accent-blue text-2xl font-bold shadow-lg">
          ‹
        </span>
      </button>

      <div
        ref={ref}
        className="flex gap-5 overflow-x-auto overflow-y-hidden pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-0 bottom-0 z-20 w-16 flex items-center justify-end pr-2 bg-gradient-to-l from-bg-dark to-transparent opacity-0 group-hover/scroll:opacity-100 transition-opacity"
      >
        <span className="w-10 h-10 rounded-full bg-bg-card border border-accent-blue/40 flex items-center justify-center text-accent-blue text-2xl font-bold shadow-lg">
          ›
        </span>
      </button>
    </div>
  );
}

function BackdropCard({ item, type }: { item: MediaItem; type: 'movie' | 'tv' }) {
  const href = `/dashboard/${type === 'tv' ? 'shows' : 'movies'}/${item.id}`;
  const title = getTitle(item);
  const year = getYear(item);

  return (
    <Link href={href} className="group/card flex-shrink-0 w-[300px]">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-accent-blue/20 hover:border-accent-blue/50 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        {item.backdrop_url || item.poster_url ? (
          <Image
            src={item.backdrop_url || item.poster_url!}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            sizes="300px"
          />
        ) : (
          <div className="w-full h-full bg-bg-card" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/90 via-bg-dark/20 to-transparent" />

        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold text-text-muted/90 uppercase tracking-wider bg-black/65 backdrop-blur-sm">
          {type === 'tv' ? 'TV SHOW' : 'MOVIE'}
        </div>

        {item.vote_average != null && item.vote_average > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-accent-blue text-xs font-bold px-2 py-0.5 rounded bg-black/65 backdrop-blur-sm">
            ★ {item.vote_average.toFixed(1)}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-text-primary font-semibold text-base leading-tight truncate group-hover/card:text-accent-blue transition-colors">
            {title}
          </p>
          {year && <p className="text-text-muted text-sm mt-1">{year}</p>}
        </div>
      </div>
    </Link>
  );
}

function Top10Card({ item, rank, type }: { item: MediaItem; rank: number; type: 'movie' | 'tv' }) {
  const href = `/dashboard/${type === 'tv' ? 'shows' : 'movies'}/${item.id}`;
  const title = getTitle(item);

  return (
    <Link href={href} className="group/card flex-shrink-0 flex items-end">
      <span
        className="text-[7.5rem] font-black leading-none select-none -mr-5 pb-1 relative z-0 flex-shrink-0"
        style={{
          color: 'transparent',
          WebkitTextStroke: '2px rgba(137, 207, 240, 0.28)',
          fontFamily: 'inherit',
        }}
      >
        {rank}
      </span>

      <div className="relative z-10 w-[140px] h-[210px] rounded-xl overflow-hidden border border-accent-blue/20 group-hover/card:border-accent-blue/55 transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.5)] flex-shrink-0">
        {item.poster_url ? (
          <Image
            src={item.poster_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            sizes="140px"
          />
        ) : (
          <div className="w-full h-full bg-bg-card flex items-center justify-center">
            <span className="text-text-muted text-xs text-center px-2">{title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/75 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-text-primary text-xs font-semibold leading-tight line-clamp-2 group-hover/card:text-accent-blue transition-colors">
            {title}
          </p>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({
  title,
  accentColor,
  tabs,
  activeTab,
  onTabChange,
}: {
  title: string;
  accentColor?: string;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div className="flex items-center gap-3.5">
        <div className={`w-1 h-7 rounded-full ${accentColor || 'bg-accent-blue'}`}
          style={{ boxShadow: '0 0 12px rgba(137,207,240,0.5)' }} />
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">{title}</h2>
      </div>
      {tabs && (
        <div className="flex gap-0.5 p-0.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'text-accent-blue bg-accent-blue/12 border border-accent-blue/20'
                  : 'text-text-muted hover:text-text-primary border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BackdropSkeletons({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[300px] aspect-video rounded-xl bg-bg-card animate-pulse" />
      ))}
    </div>
  );
}

function Top10Skeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 flex items-end">
          <div className="w-20 h-28 bg-transparent" />
          <div className="w-[140px] h-[210px] rounded-xl bg-bg-card animate-pulse" />
        </div>
      ))}
    </div>
  );
}

const MEDIA_TABS = [
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'Series' },
];

const GENRES = [
  { id: '35', name: 'Comedy' },
  { id: '28', name: 'Action' },
  { id: '27', name: 'Horror' },
  { id: '10749', name: 'Romance' },
  { id: '878', name: 'SciFi' },
  { id: '18', name: 'Drama' },
  { id: '16', name: 'Animation' },
];

const PROVIDERS = [
  { id: '8', name: 'Netflix' },
  { id: '9', name: 'Prime' },
  { id: '1899', name: 'Max' },
  { id: '337', name: 'Disney+' },
  { id: '350', name: 'AppleTV' },
  { id: '531', name: 'Paramount' },
];

export default function HomePage() {
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [trendingShows, setTrendingShows] = useState<MediaItem[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ContinueWatchingItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [trendingTab, setTrendingTab] = useState<'movie' | 'tv'>('movie');
  const [top10Tab, setTop10Tab] = useState<'movie' | 'tv'>('movie');
  const [topRatedTab, setTopRatedTab] = useState<'movie' | 'tv'>('movie');
  const [topRatedShows, setTopRatedShows] = useState<MediaItem[]>([]);
  const [topRatedShowsLoaded, setTopRatedShowsLoaded] = useState(false);

  const [genreTab, setGenreTab] = useState(GENRES[0].id);
  const [genreCache, setGenreCache] = useState<Record<string, MediaItem[]>>({});
  const [genreLoading, setGenreLoading] = useState(false);

  const [providerTab, setProviderTab] = useState(PROVIDERS[0].id);
  const [providerCache, setProviderCache] = useState<Record<string, MediaItem[]>>({});
  const [providerLoading, setProviderLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [tmRes, tsRes, trRes, cwRes] = await Promise.all([
          fetch('/api/movies/trending?timeWindow=day&type=movie'),
          fetch('/api/movies/trending?timeWindow=day&type=tv'),
          fetch('/api/movies/top-rated'),
          fetch('/api/watch-progress', { credentials: 'include' }),
        ]);

        if (tmRes.ok) setTrendingMovies((await tmRes.json()).data?.results ?? []);
        if (tsRes.ok) setTrendingShows((await tsRes.json()).data?.results ?? []);
        if (trRes.ok) setTopRatedMovies((await trRes.json()).data?.results ?? []);
        if (cwRes.ok) setContinueWatching((await cwRes.json()).data ?? []);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fetchGenre = useCallback(async (genreId: string) => {
    if (genreCache[genreId]) return;
    setGenreLoading(true);
    try {
      const res = await fetch(`/api/movies/discover?with_genres=${genreId}&type=movie`);
      if (res.ok) {
        const items = (await res.json()).data?.results ?? [];
        setGenreCache((prev) => ({ ...prev, [genreId]: items }));
      }
    } catch (e) {
      console.error('Genre fetch error:', e);
    } finally {
      setGenreLoading(false);
    }
  }, [genreCache]);

  const fetchProvider = useCallback(async (providerId: string) => {
    if (providerCache[providerId]) return;
    setProviderLoading(true);
    try {
      const res = await fetch(`/api/movies/discover?with_watch_providers=${providerId}&type=tv`);
      if (res.ok) {
        const items = (await res.json()).data?.results ?? [];
        setProviderCache((prev) => ({ ...prev, [providerId]: items }));
      }
    } catch (e) {
      console.error('Provider fetch error:', e);
    } finally {
      setProviderLoading(false);
    }
  }, [providerCache]);

  useEffect(() => {
    fetchGenre(GENRES[0].id);
    fetchProvider(PROVIDERS[0].id);
  }, []);

  const handleTopRatedTab = async (id: string) => {
    const tab = id as 'movie' | 'tv';
    setTopRatedTab(tab);
    if (tab === 'tv' && !topRatedShowsLoaded) {
      try {
        const res = await fetch('/api/movies/top-rated?type=tv');
        if (res.ok) {
          setTopRatedShows((await res.json()).data?.results ?? []);
          setTopRatedShowsLoaded(true);
        }
      } catch (e) {
        console.error('Top rated shows fetch error:', e);
      }
    }
  };

  const handleGenreTab = (id: string) => {
    setGenreTab(id);
    fetchGenre(id);
  };

  const handleProviderTab = (id: string) => {
    setProviderTab(id);
    fetchProvider(id);
  };

  const requestDeleteContinueWatching = (item: ContinueWatchingItem) => {
    setDeleteTarget(item);
  };

  const confirmDeleteContinueWatching = async () => {
    if (!deleteTarget || deleteBusy) return;
    setDeleteBusy(true);
    try {
      const params = new URLSearchParams({
        tmdbId: String(deleteTarget.tmdb_id),
        mediaType: deleteTarget.media_type,
        season: String(deleteTarget.season ?? 0),
        episode: String(deleteTarget.episode ?? 0),
      });

      const res = await fetch(`/api/watch-progress?${params.toString()}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to delete watch progress');

      setContinueWatching((prev) =>
        prev.filter(
          (p) =>
            !(
              p.tmdb_id === deleteTarget.tmdb_id &&
              p.media_type === deleteTarget.media_type &&
              p.season === deleteTarget.season &&
              p.episode === deleteTarget.episode
            )
        )
      );
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteBusy(false);
    }
  };

  const [heroIndex, setHeroIndex] = useState(0);
  const heroPool = trendingMovies.slice(0, 10);

  useEffect(() => {
    if (heroPool.length <= 1) return;
    const id = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroPool.length);
    }, 8000);
    return () => clearInterval(id);
  }, [heroPool.length]);

  const featured = heroPool[heroIndex] ?? null;
  const top10 = top10Tab === 'movie' ? trendingMovies.slice(0, 10) : trendingShows.slice(0, 10);
  const trendingItems = trendingTab === 'movie' ? trendingMovies : trendingShows;
  const topRatedItems = topRatedTab === 'movie' ? topRatedMovies : topRatedShows;
  const genreItems = genreCache[genreTab] ?? [];
  const providerItems = providerCache[providerTab] ?? [];

  const genreTabs = GENRES.map((g) => ({ id: g.id, label: g.name }));
  const providerTabs = PROVIDERS.map((p) => ({ id: p.id, label: p.name }));

  return (
    <div className="pb-28">
      {!loading && featured ? (
        <section className="relative h-[560px] overflow-hidden">
          {heroPool.map((item, i) => (
            <div
              key={item.id}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{ opacity: i === heroIndex ? 1 : 0 }}
            >
              {item.backdrop_url ? (
                <Image
                  src={item.backdrop_url}
                  alt={getTitle(item)}
                  fill
                  className="object-cover"
                  priority={i === 0}
                />
              ) : (
                <div className="w-full h-full bg-bg-card" />
              )}
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent" />

          <div className="relative h-full max-w-[1480px] mx-auto px-10 flex items-center">
            <div className="max-w-[520px]">
              <div className="flex items-center gap-2 mb-4 text-sm text-text-muted flex-wrap">
                {featured.vote_average != null && featured.vote_average > 0 && (
                  <span className="text-accent-blue font-bold flex items-center gap-1">
                    ★ {featured.vote_average.toFixed(1)}
                  </span>
                )}
                {featured.vote_average != null && featured.vote_average > 0 && getYear(featured) && (
                  <span className="opacity-40">|</span>
                )}
                {getYear(featured) && <span>{getYear(featured)}</span>}
              </div>

              <h1 className="text-6xl font-black text-text-primary leading-tight mb-5">
                {getTitle(featured)}
              </h1>

              {featured.overview && (
                <p className="text-text-muted leading-relaxed mb-10 line-clamp-3 text-base">
                  {featured.overview}
                </p>
              )}

              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-7 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-[0_4px_20px_rgba(255,255,255,0.18)]">
                  <span className="text-sm">▶</span> Play
                </button>
                <Link
                  href={`/dashboard/movies/${featured.id}`}
                  className="flex items-center gap-2 px-7 py-3 border border-white/30 text-white/90 bg-white/5 rounded-full hover:border-accent-blue/60 hover:text-accent-blue hover:bg-accent-blue/8 active:scale-[0.98] transition-all text-sm font-semibold backdrop-blur-sm"
                >
                  <span className="text-sm">ⓘ</span> More info
                </Link>
              </div>

              {/* Dot indicators */}
              <div className="flex gap-2.5 mt-12">
                {heroPool.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIndex(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === heroIndex ? 'bg-accent-blue w-8' : 'w-2.5 bg-text-muted/40 hover:bg-text-muted/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : loading ? (
        <div className="h-[560px] bg-bg-card animate-pulse" />
      ) : null}

      <div className="max-w-[1480px] mx-auto px-10 mt-14">

        {loading ? (
          <section className="mb-14">
            <div className="h-7 w-52 bg-bg-card animate-pulse rounded mb-7" />
            <div className="flex gap-5 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[320px] aspect-video bg-bg-card animate-pulse rounded-xl" />
              ))}
            </div>
          </section>
        ) : continueWatching.length > 0 ? (
          <section className="mb-14">
            <SectionHeader title="Continue Watching" />
            <ScrollRow>
              {continueWatching.map((item) => (
                <ContinueWatchingCard
                  key={`${item.media_type}-${item.tmdb_id}-${item.season}-${item.episode}`}
                  item={item}
                  onRequestDelete={requestDeleteContinueWatching}
                />
              ))}
            </ScrollRow>
          </section>
        ) : null}

        <section className="mb-14">
          <div className="flex items-end justify-between mb-7">
            <div className="flex items-end gap-3">
              <div className="flex items-end gap-1 leading-none">
                <span className="text-4xl font-black text-text-primary">TOP</span>
                <span
                  className="text-4xl font-black"
                  style={{ color: 'transparent', WebkitTextStroke: '2px rgba(137,207,240,0.7)' }}
                >
                  10
                </span>
              </div>
              <div className="mb-0.5">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] leading-none">
                  CONTENT TODAY
                </p>
              </div>
            </div>
            <div className="flex gap-0.5 p-0.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              {MEDIA_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTop10Tab(tab.id as 'movie' | 'tv')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    top10Tab === tab.id
                      ? 'text-accent-blue bg-accent-blue/12 border border-accent-blue/20'
                      : 'text-text-muted hover:text-text-primary border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Top10Skeletons />
          ) : top10.length > 0 ? (
            <ScrollRow>
              {top10.map((item, i) => (
                <Top10Card key={item.id} item={item} rank={i + 1} type={top10Tab} />
              ))}
            </ScrollRow>
          ) : (
            <p className="text-text-muted">No data available.</p>
          )}
        </section>

        <section className="mb-14">
          <SectionHeader
            title="Trending Today"
            tabs={MEDIA_TABS}
            activeTab={trendingTab}
            onTabChange={(id) => setTrendingTab(id as 'movie' | 'tv')}
          />
          {loading ? (
            <BackdropSkeletons />
          ) : trendingItems.length > 0 ? (
            <ScrollRow>
              {trendingItems.map((item) => (
                <BackdropCard key={item.id} item={item} type={trendingTab} />
              ))}
            </ScrollRow>
          ) : (
            <p className="text-text-muted">No trending content right now.</p>
          )}
        </section>

        <section className="mb-14">
          <SectionHeader
            title="Top Rated"
            tabs={MEDIA_TABS}
            activeTab={topRatedTab}
            onTabChange={handleTopRatedTab}
          />
          {loading ? (
            <BackdropSkeletons />
          ) : topRatedItems.length > 0 ? (
            <ScrollRow>
              {topRatedItems.map((item) => (
                <BackdropCard key={item.id} item={item} type={topRatedTab} />
              ))}
            </ScrollRow>
          ) : (
            <p className="text-text-muted">No top rated content available.</p>
          )}
        </section>

        <section className="mb-14">
          <SectionHeader
            title={PROVIDERS.find((p) => p.id === providerTab)?.name ?? 'Netflix'}
            accentColor="bg-accent-blue"
            tabs={providerTabs}
            activeTab={providerTab}
            onTabChange={handleProviderTab}
          />
          {providerLoading && providerItems.length === 0 ? (
            <BackdropSkeletons />
          ) : providerItems.length > 0 ? (
            <ScrollRow>
              {providerItems.map((item) => (
                <BackdropCard key={item.id} item={item} type="tv" />
              ))}
            </ScrollRow>
          ) : (
            <p className="text-text-muted">No content available for this provider.</p>
          )}
        </section>

        <section className="mb-14">
          <SectionHeader
            title="Genres"
            accentColor="bg-accent-blue"
            tabs={genreTabs}
            activeTab={genreTab}
            onTabChange={handleGenreTab}
          />
          {genreLoading && genreItems.length === 0 ? (
            <BackdropSkeletons />
          ) : genreItems.length > 0 ? (
            <ScrollRow>
              {genreItems.map((item) => (
                <BackdropCard key={item.id} item={item} type="movie" />
              ))}
            </ScrollRow>
          ) : (
            <p className="text-text-muted">No content available for this genre.</p>
          )}
        </section>

      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => {
            if (!deleteBusy) setDeleteTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-bg-card border border-accent-blue/20 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-text-primary">Remove from Continue Watching?</h3>
            <p className="text-text-muted text-sm mt-2">
              This will delete your saved progress for{' '}
              <span className="text-text-primary font-semibold">{deleteTarget.title ?? 'this item'}</span>
              {deleteTarget.media_type === 'tv'
                ? ` (S${deleteTarget.season} · E${deleteTarget.episode})`
                : ''}.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteBusy}
                className="px-4 py-2 rounded-full border border-white/25 text-white/90 hover:border-white/40 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteContinueWatching}
                disabled={deleteBusy}
                className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50"
              >
                {deleteBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
