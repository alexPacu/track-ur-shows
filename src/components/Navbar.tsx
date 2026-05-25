'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SearchIcon, BookmarkIcon, UserIcon, StarIcon, UsersIcon } from './Icons';

const GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy',
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
}

function ResultRow({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const title  = result.title ?? result.name ?? 'Unknown';
  const year   = (() => {
    const d = result.release_date ?? result.first_air_date;
    return d ? new Date(d).getFullYear() : null;
  })();
  const genres = (result.genre_ids ?? []).slice(0, 2).map(id => GENRES[id]).filter(Boolean);
  const isTV   = result.media_type === 'tv';

  return (
    <button
      type="button"
      role="option"
      aria-selected={false}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left"
    >
      <div className="flex-shrink-0 w-12 h-[72px] rounded-md overflow-hidden bg-bg-dark/60 border border-white/[0.06]">
        {result.poster_url ? (
          <Image
            src={result.poster_url}
            alt={title}
            width={48}
            height={72}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <SearchIcon className="h-4 w-4 text-text-muted/40" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-text-primary truncate">{title}</span>
          {year && <span className="flex-shrink-0 text-xs text-text-muted">({year})</span>}
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-blue/10 text-accent-blue">
            {isTV ? 'TV' : 'Movie'}
          </span>

          {result.vote_average != null && result.vote_average > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-text-muted">
              <StarIcon className="h-3 w-3 text-accent-blue" />
              {result.vote_average.toFixed(1)}
            </span>
          )}

          {genres.map((g, i) => (
            <span key={i} className="text-[10px] text-text-muted/70">{g}</span>
          ))}
        </div>
      </div>
    </button>
  );
}

export function Navbar() {
  const [searchQuery, setSearchQuery]   = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropResults, setDropResults]   = useState<SearchResult[]>([]);
  const [dropLoading, setDropLoading]   = useState(false);
  const [dropError, setDropError]       = useState(false);

  const pathname     = usePathname();
  const router       = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef     = useRef<AbortController | null>(null);

  const isActive = (href: string) => pathname === href;

  // close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
    setSearchQuery('');
    setDropResults([]);
  }, [pathname]);

  // clickoutside handlers
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = searchQuery.trim();
    if (q.length < 2) {
      setDropdownOpen(false);
      setDropResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      setDropLoading(true);
      setDropError(false);
      setDropdownOpen(true);

      try {
        const [movRes, tvRes] = await Promise.all([
          fetch(`/api/movies/search?query=${encodeURIComponent(q)}&type=movie`, { signal }).then(r => r.json()),
          fetch(`/api/movies/search?query=${encodeURIComponent(q)}&type=tv`,    { signal }).then(r => r.json()),
        ]);
        const combined = [
          ...(movRes.data?.results ?? []),
          ...(tvRes.data?.results ?? []),
        ]
          .sort((a: SearchResult, b: SearchResult) => {
            const qLow = q.toLowerCase();
            const aExact = (a.title ?? a.name ?? '').toLowerCase() === qLow ? 1 : 0;
            const bExact = (b.title ?? b.name ?? '').toLowerCase() === qLow ? 1 : 0;
            if (bExact !== aExact) return bExact - aExact;
            return (b.vote_average ?? 0) - (a.vote_average ?? 0);
          })
          .slice(0, 6);
        setDropResults(combined);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setDropError(true);
        }
      } finally {
        if (!signal.aborted) setDropLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length >= 2) {
      setDropdownOpen(false);
      router.push(`/dashboard/search?q=${encodeURIComponent(q)}`);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const path = result.media_type === 'tv'
      ? `/dashboard/shows/${result.id}`
      : `/dashboard/movies/${result.id}`;
    setDropdownOpen(false);
    setSearchQuery('');
    router.push(path);
  };

  const hasResults = dropResults.length > 0;

  return (
    <header className="sticky top-0 z-50 bg-bg-dark/90 backdrop-blur-xl border-b border-white/[0.05]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent" />

      <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between px-10">

        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/15 border border-accent-blue/20 flex items-center justify-center text-accent-blue text-xs font-black group-hover:bg-accent-blue/22 transition-colors">
            ▶
          </div>
          <span className="text-[19px] font-bold tracking-tight text-text-primary group-hover:text-accent-blue transition-colors">
            TrackUrShows
          </span>
        </Link>

        <div ref={containerRef} className="mx-10 flex max-w-md flex-1 relative">
          <form onSubmit={handleSearch} className="w-full relative">
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls="search-dropdown"
              aria-label="Search movies and TV shows"
              placeholder="Search movies & shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-white/[0.07] bg-bg-card/60 px-4 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted focus:border-accent-blue/40 focus:outline-none focus:ring-2 focus:ring-accent-blue/12 transition-all"
            />
            <button
              type="submit"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-blue transition-colors"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>

          {dropdownOpen && (
            <div
              id="search-dropdown"
              role="listbox"
              aria-label="Search results"
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-xl border border-white/[0.07] bg-bg-card backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] max-h-[420px] overflow-y-auto"
            >
              {dropLoading && (
                <div className="flex items-center justify-center py-7">
                  <div className="w-5 h-5 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
                </div>
              )}

              {!dropLoading && dropError && (
                <div className="px-4 py-6 text-center text-sm text-text-muted">
                  Search failed. Please try again.
                </div>
              )}

              {!dropLoading && !dropError && !hasResults && (
                <div className="px-4 py-6 text-center text-sm text-text-muted">
                  No results for &ldquo;{searchQuery.trim()}&rdquo;
                </div>
              )}

              {!dropLoading && !dropError && dropResults.map(r => (
                <ResultRow key={`${r.media_type}-${r.id}`} result={r} onClick={() => handleResultClick(r)} />
              ))}

              {!dropLoading && !dropError && hasResults && (
                <div className="border-t border-white/[0.05] px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                    className="w-full text-center text-xs text-accent-blue hover:text-accent-blue/70 transition-colors"
                  >
                    See all results &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard/watchlist"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
              isActive('/dashboard/watchlist')
                ? 'text-accent-blue bg-accent-blue/10 border border-accent-blue/20'
                : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <BookmarkIcon className="h-4 w-4" />
            <span>Watchlist</span>
          </Link>
          <Link
            href="/dashboard/friends"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
              isActive('/dashboard/friends')
                ? 'text-accent-blue bg-accent-blue/10 border border-accent-blue/20'
                : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <UsersIcon className="h-4 w-4" />
            <span>Friends</span>
          </Link>
          <Link
            href="/dashboard/profile"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
              isActive('/dashboard/profile')
                ? 'text-accent-blue bg-accent-blue/10 border border-accent-blue/20'
                : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </nav>

      </div>
    </header>
  );
}
