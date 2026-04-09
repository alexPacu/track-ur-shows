'use client';

import { useState, useEffect, useRef } from 'react';
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
    ref.current?.scrollBy({ left: dir === 'right' ? 520 : -520, behavior: 'smooth' });

  return (
    <div className="relative group/scroll">
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-0 bottom-0 z-10 w-14 flex items-center justify-start pl-1 bg-gradient-to-r from-bg-dark to-transparent opacity-0 group-hover/scroll:opacity-100 transition-opacity"
      >
        <span className="w-9 h-9 rounded-full bg-bg-card border border-accent-blue/40 flex items-center justify-center text-accent-blue text-xl font-bold shadow-lg">
          ‹
        </span>
      </button>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-0 bottom-0 z-10 w-14 flex items-center justify-end pr-1 bg-gradient-to-l from-bg-dark to-transparent opacity-0 group-hover/scroll:opacity-100 transition-opacity"
      >
        <span className="w-9 h-9 rounded-full bg-bg-card border border-accent-blue/40 flex items-center justify-center text-accent-blue text-xl font-bold shadow-lg">
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
    <Link href={href} className="group/card flex-shrink-0 w-[260px]">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-accent-blue/20 hover:border-accent-blue/50 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        {item.backdrop_url || item.poster_url ? (
          <Image
            src={item.backdrop_url || item.poster_url!}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            sizes="260px"
          />
        ) : (
          <div className="w-full h-full bg-bg-card" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/90 via-bg-dark/20 to-transparent" />

        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-bg-dark/70 text-text-muted uppercase tracking-wider backdrop-blur-sm">
          {type === 'tv' ? 'TV SHOW' : 'MOVIE'}
        </div>

        {item.vote_average != null && item.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-bg-dark/70 text-accent-blue text-xs font-bold backdrop-blur-sm">
            ★ {item.vote_average.toFixed(1)}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-text-primary font-semibold text-sm leading-tight truncate group-hover/card:text-accent-blue transition-colors">
            {title}
          </p>
          {year && <p className="text-text-muted text-xs mt-0.5">{year}</p>}
        </div>
      </div>
    </Link>
  );
}

// ── top 10 numbered poster card ───────────────────────────────────────────────
function Top10Card({ item, rank, type }: { item: MediaItem; rank: number; type: 'movie' | 'tv' }) {
  const href = `/dashboard/${type === 'tv' ? 'shows' : 'movies'}/${item.id}`;
  const title = getTitle(item);

  return (
    <Link href={href} className="group/card flex-shrink-0 flex items-end">
      <span
        className="text-[6.5rem] font-black leading-none select-none -mr-5 pb-1 relative z-0 flex-shrink-0"
        style={{
          color: 'transparent',
          WebkitTextStroke: '2px rgba(137, 207, 240, 0.28)',
          fontFamily: 'inherit',
        }}
      >
        {rank}
      </span>

      <div className="relative z-10 w-[130px] h-[192px] rounded-xl overflow-hidden border border-accent-blue/20 group-hover/card:border-accent-blue/55 transition-all duration-300 shadow-[0_6px_16px_rgba(0,0,0,0.5)] flex-shrink-0">
        {item.poster_url ? (
          <Image
            src={item.poster_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            sizes="130px"
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
  tabs,
  activeTab,
  onTabChange,
}: {
  title: string;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 rounded-full bg-accent-blue" />
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      </div>
      {tabs && (
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`px-3 py-1 text-sm font-semibold transition-all border-b-2 ${
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
    <div className="flex gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[260px] aspect-video rounded-xl bg-bg-card animate-pulse" />
      ))}
    </div>
  );
}

function Top10Skeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 flex items-end">
          <div className="w-16 h-24 bg-transparent" />
          <div className="w-[130px] h-[192px] rounded-xl bg-bg-card animate-pulse" />
        </div>
      ))}
    </div>
  );
}

const MEDIA_TABS = [
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'Series' },
];

export default function HomePage() {
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [trendingShows, setTrendingShows] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [popularShows, setPopularShows] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [trendingTab, setTrendingTab] = useState<'movie' | 'tv'>('movie');
  const [popularTab, setPopularTab] = useState<'movie' | 'tv'>('movie');
  const [top10Tab, setTop10Tab] = useState<'movie' | 'tv'>('movie');

  useEffect(() => {
    const load = async () => {
      try {
        const [tmRes, tsRes, pmRes, psRes] = await Promise.all([
          fetch('/api/movies/trending?timeWindow=day&type=movie'),
          fetch('/api/movies/trending?timeWindow=day&type=tv'),
          fetch('/api/movies/popular?page=1&type=movie'),
          fetch('/api/movies/popular?page=1&type=tv'),
        ]);

        if (tmRes.ok) setTrendingMovies((await tmRes.json()).data?.results ?? []);
        if (tsRes.ok) setTrendingShows((await tsRes.json()).data?.results ?? []);
        if (pmRes.ok) setPopularMovies((await pmRes.json()).data?.results ?? []);
        if (psRes.ok) setPopularShows((await psRes.json()).data?.results ?? []);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featured = trendingMovies[0];
  const top10 = top10Tab === 'movie' ? trendingMovies.slice(0, 10) : trendingShows.slice(0, 10);
  const trendingItems = trendingTab === 'movie' ? trendingMovies : trendingShows;
  const popularItems = popularTab === 'movie' ? popularMovies : popularShows;

  return (
    <div className="pb-24">
      {!loading && featured ? (
        <section className="relative h-[520px] overflow-hidden">
          <div className="absolute inset-0">
            {featured.backdrop_url ? (
              <Image
                src={featured.backdrop_url}
                alt={getTitle(featured)}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-bg-card" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/65 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent" />
          </div>

          <div className="relative h-full max-w-7xl mx-auto px-8 flex items-center">
            <div className="max-w-[500px]">
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

              <h1 className="text-5xl font-black text-text-primary leading-tight mb-5">
                {getTitle(featured)}
              </h1>

              {featured.overview && (
                <p className="text-text-muted leading-relaxed mb-8 line-clamp-3 text-[15px]">
                  {featured.overview}
                </p>
              )}

              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-7 py-3 bg-text-primary text-bg-dark font-bold rounded-lg hover:bg-accent-blue transition-colors text-sm">
                  ▶&nbsp;Play
                </button>
                <Link
                  href={`/dashboard/movies/${featured.id}`}
                  className="flex items-center gap-2 px-7 py-3 border border-white/25 text-text-primary rounded-lg hover:border-accent-blue hover:text-accent-blue transition-colors text-sm font-semibold"
                >
                  ⓘ&nbsp;See More
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : loading ? (
        <div className="h-[520px] bg-bg-card animate-pulse" />
      ) : null}

      <div className="max-w-7xl mx-auto px-6 mt-10 space-y-12">

        <section>
          <div className="flex items-end justify-between mb-6">
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
                  className={`px-3 py-1 text-sm font-semibold transition-all border-b-2 ${
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
            <p className="text-text-muted text-sm">No data available.</p>
          )}
        </section>

        <section>
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
            <p className="text-text-muted text-sm">No trending content right now.</p>
          )}
        </section>

        <section>
          <SectionHeader
            title="Popular Now"
            tabs={MEDIA_TABS}
            activeTab={popularTab}
            onTabChange={(id) => setPopularTab(id as 'movie' | 'tv')}
          />
          {loading ? (
            <BackdropSkeletons />
          ) : popularItems.length > 0 ? (
            <ScrollRow>
              {popularItems.map((item) => (
                <BackdropCard key={item.id} item={item} type={popularTab} />
              ))}
            </ScrollRow>
          ) : (
            <p className="text-text-muted text-sm">No popular content right now.</p>
          )}
        </section>

      </div>
    </div>
  );
}
