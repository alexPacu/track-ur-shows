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
        className="absolute left-0 top-0 bottom-0 z-10 w-16 flex items-center justify-start pl-2 bg-gradient-to-r from-bg-dark to-transparent opacity-0 group-hover/scroll:opacity-100 transition-opacity"
      >
        <span className="w-10 h-10 rounded-full bg-bg-card border border-accent-blue/40 flex items-center justify-center text-accent-blue text-2xl font-bold shadow-lg">
          ‹
        </span>
      </button>

      <div
        ref={ref}
        className="flex gap-5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-0 bottom-0 z-10 w-16 flex items-center justify-end pr-2 bg-gradient-to-l from-bg-dark to-transparent opacity-0 group-hover/scroll:opacity-100 transition-opacity"
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

        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold text-text-muted/90 uppercase tracking-wider">
          {type === 'tv' ? 'TV SHOW' : 'MOVIE'}
        </div>

        {item.vote_average != null && item.vote_average > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-accent-blue text-xs font-bold">
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
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-6 rounded-full ${accentColor || 'bg-accent-blue'}`} />
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
      </div>
      {tabs && (
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`px-4 py-1.5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-accent-blue border-accent-blue'
                  : 'text-text-muted border-transparent hover:text-text-primary'
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
        const [tmRes, tsRes, trRes] = await Promise.all([
          fetch('/api/movies/trending?timeWindow=day&type=movie'),
          fetch('/api/movies/trending?timeWindow=day&type=tv'),
          fetch('/api/movies/top-rated'),
        ]);

        if (tmRes.ok) setTrendingMovies((await tmRes.json()).data?.results ?? []);
        if (tsRes.ok) setTrendingShows((await tsRes.json()).data?.results ?? []);
        if (trRes.ok) setTopRatedMovies((await trRes.json()).data?.results ?? []);
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

              <div className="flex gap-4">
                <button className="flex items-center gap-2.5 px-8 py-3.5 bg-white text-black font-bold rounded-full hover:bg-white/85 transition-colors text-sm">
                  <span className="text-base">▶</span> Play
                </button>
                <Link
                  href={`/dashboard/movies/${featured.id}`}
                  className="flex items-center gap-2.5 px-8 py-3.5 border-2 border-white/60 text-white rounded-full hover:border-accent-blue hover:text-accent-blue transition-colors text-sm font-semibold"
                >
                  <span className="text-base">ⓘ</span> See More
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
            <div className="flex gap-1">
              {MEDIA_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTop10Tab(tab.id as 'movie' | 'tv')}
                  className={`px-4 py-1.5 text-sm font-semibold transition-all border-b-2 ${
                    top10Tab === tab.id
                      ? 'text-accent-blue border-accent-blue'
                      : 'text-text-muted border-transparent hover:text-text-primary'
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
    </div>
  );
}
