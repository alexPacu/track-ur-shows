'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { StarIcon } from '@/components/Icons';

const GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type: 'movie' | 'tv';
  poster_url?: string;
  vote_average?: number;
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
  overview?: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(q.length >= 2);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (q.length < 2) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setResults([]);

    Promise.all([
      fetch(`/api/movies/search?query=${encodeURIComponent(q)}&type=movie`).then(r => r.json()),
      fetch(`/api/movies/search?query=${encodeURIComponent(q)}&type=tv`).then(r => r.json()),
    ])
      .then(([moviesData, showsData]) => {
        if (cancelled) return;
        const combined: SearchResult[] = [
          ...(moviesData.data?.results ?? []),
          ...(showsData.data?.results ?? []),
        ].sort((a, b) => {
          const qLow = q.toLowerCase();
          const aExact = (a.title ?? a.name ?? '').toLowerCase() === qLow ? 1 : 0;
          const bExact = (b.title ?? b.name ?? '').toLowerCase() === qLow ? 1 : 0;
          if (bExact !== aExact) return bExact - aExact;
          return (b.vote_average ?? 0) - (a.vote_average ?? 0);
        });
        setResults(combined);
      })
      .catch(() => {
        if (!cancelled) setError('Search failed. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [q]);

  if (!q || q.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-text-muted text-lg">Enter at least 2 characters to search.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-text-primary">
          Results for <span className="text-accent-blue">&ldquo;{q}&rdquo;</span>
        </h1>
        {!loading && results.length > 0 && (
          <span className="text-sm text-text-muted">{results.length} found</span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center justify-center py-24">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-text-muted text-lg">No results found for &ldquo;{q}&rdquo;.</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((item) => {
            const title   = item.title ?? item.name ?? 'Unknown';
            const year    = (() => {
              const d = item.release_date ?? item.first_air_date;
              return d ? new Date(d).getFullYear() : null;
            })();
            const genres  = (item.genre_ids ?? []).slice(0, 3).map(id => GENRES[id]).filter(Boolean);
            const isTV    = item.media_type === 'tv';
            const href    = `/dashboard/${isTV ? 'shows' : 'movies'}/${item.id}`;

            return (
              <Link key={`${item.media_type}-${item.id}`} href={href}>
                <div className="flex gap-4 rounded-xl border border-white/[0.05] bg-bg-card/40 p-4 transition-all hover:border-accent-blue/25 hover:bg-bg-card/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">

                  <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-bg-dark border border-white/[0.06]">
                    {item.poster_url ? (
                      <Image
                        src={item.poster_url}
                        alt={title}
                        width={64}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted/30 text-xs text-center px-1">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text-primary truncate">{title}</span>
                      {year && <span className="text-sm text-text-muted flex-shrink-0">({year})</span>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                        {isTV ? 'TV Show' : 'Movie'}
                      </span>

                      {item.vote_average != null && item.vote_average > 0 && (
                        <span className="flex items-center gap-1 text-sm text-text-muted">
                          <StarIcon className="h-3.5 w-3.5 text-accent-blue" />
                          <span className="text-text-primary font-medium">{item.vote_average.toFixed(1)}</span>
                        </span>
                      )}

                      {genres.map((g, i) => (
                        <span key={i} className="text-xs text-text-muted/70 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.05]">
                          {g}
                        </span>
                      ))}
                    </div>

                    {item.overview && (
                      <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
                        {item.overview}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
