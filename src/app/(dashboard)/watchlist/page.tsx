'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import Image from 'next/image';
import Link from 'next/link';
import { XIcon, StarIcon, HeartIcon } from '@/components/Icons';

function StarRating({
  rating,
  onRate,
}: {
  rating?: number | null;
  onRate: (rating: number | null) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const currentStars = rating != null ? Math.round(Number(rating) / 2) : 0;
  const displayStars = hovered ?? currentStars;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRate(currentStars === star ? null : star * 2); }}
          onMouseEnter={() => setHovered(star)}
          className={`text-sm leading-none transition-colors ${
            star <= displayStars ? 'text-yellow-400' : 'text-white/20 hover:text-white/40'
          }`}
        >
          ★
        </button>
      ))}
      {rating != null && (
        <span className="text-xs text-text-muted ml-1">{Number(rating).toFixed(0)}/10</span>
      )}
    </div>
  );
}

type SeasonInfo = { season_number: number; episode_count: number };

function ProgressPicker({
  tmdbId,
  season,
  episode,
  onChange,
}: {
  tmdbId: number;
  season?: number | null;
  episode?: number | null;
  onChange: (season: number, episode: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [s, setS] = useState('');
  const [e, setE] = useState('');
  const [seasons, setSeasons] = useState<SeasonInfo[] | null>(null);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setS(season ? String(season) : '');
    setE(episode ? String(episode) : '');
    setError(null);
    setEditing(true);
    if (!seasons) {
      setLoadingSeasons(true);
      try {
        const res = await fetch(`/api/shows/${tmdbId}`);
        if (res.ok) {
          const data = await res.json();
          setSeasons(
            (data.data?.seasons ?? [])
              .filter((s: any) => s.season_number > 0)
              .map((s: any) => ({ season_number: s.season_number, episode_count: s.episode_count }))
          );
        }
      } finally {
        setLoadingSeasons(false);
      }
    }
  };

  const blockNonNumeric = (ev: React.KeyboardEvent) => {
    if (['e', 'E', '+', '-', '.'].includes(ev.key)) ev.preventDefault();
  };

  const validate = (sn: number, ep: number): string | null => {
    if (!Number.isInteger(sn) || sn < 1) return 'Season must be a positive number';
    if (!Number.isInteger(ep) || ep < 1) return 'Episode must be a positive number';
    if (seasons) {
      const seasonData = seasons.find((s) => s.season_number === sn);
      if (!seasonData) return `Season ${sn} doesn't exist (show has ${seasons.length} season${seasons.length !== 1 ? 's' : ''})`;
      if (ep > seasonData.episode_count) return `S${sn} only has ${seasonData.episode_count} episode${seasonData.episode_count !== 1 ? 's' : ''}`;
    }
    return null;
  };

  const tryCommit = (closeOnInvalid = false) => {
    const sn = parseInt(s);
    const ep = parseInt(e);
    const err = validate(sn, ep);
    if (err) {
      if (closeOnInvalid) { setEditing(false); return; }
      setError(err);
      return;
    }
    onChange(sn, ep);
    setEditing(false);
    setError(null);
  };

  if (!editing) {
    return (
      <button
        onClick={(ev) => { ev.preventDefault(); open(); }}
        className="text-xs transition-colors text-text-muted hover:text-text-primary"
      >
        {season && episode
          ? <span className="text-text-primary/70">S{season} · E{episode}</span>
          : <span className="opacity-40">S? · E?</span>}
      </button>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-1"
        onBlur={(ev) => { if (!ev.currentTarget.contains(ev.relatedTarget)) tryCommit(true); }}
      >
        <span className="text-text-muted text-xs">S</span>
        <input
          type="number" min={1} step={1} value={s}
          onChange={(ev) => { setS(ev.target.value); setError(null); }}
          onKeyDown={(ev) => { blockNonNumeric(ev); if (ev.key === 'Enter') tryCommit(); if (ev.key === 'Escape') setEditing(false); }}
          autoFocus
          className="w-8 bg-white/10 border border-white/20 rounded text-xs text-center text-text-primary focus:outline-none focus:border-accent-blue/50 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-text-muted text-xs">E</span>
        <input
          type="number" min={1} step={1} value={e}
          onChange={(ev) => { setE(ev.target.value); setError(null); }}
          onKeyDown={(ev) => { blockNonNumeric(ev); if (ev.key === 'Enter') tryCommit(); if (ev.key === 'Escape') setEditing(false); }}
          className="w-8 bg-white/10 border border-white/20 rounded text-xs text-center text-text-primary focus:outline-none focus:border-accent-blue/50 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {loadingSeasons && <div className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin ml-1" />}
      </div>
      {error && <p className="text-red-400 text-xs mt-0.5 leading-tight">{error}</p>}
    </div>
  );
}

function WatchlistCard({
  item,
  isConfirming,
  onRemove,
  onCancelConfirm,
  onStatusChange,
  onRatingChange,
  onProgressChange,
  onFavoriteToggle,
}: {
  item: WatchlistItem;
  isConfirming: boolean;
  onRemove: () => void;
  onCancelConfirm: () => void;
  onStatusChange: (status: string) => void;
  onRatingChange: (rating: number | null) => void;
  onProgressChange: (season: number, episode: number) => void;
  onFavoriteToggle: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const href =
    item.media_type === 'movie'
      ? `/dashboard/movies/${item.tmdb_id}`
      : `/dashboard/shows/${item.tmdb_id}`;
  const posterUrl = item.poster_path && !imgError
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : null;

  return (
    <div className="group relative flex flex-col">
      <Link href={href} className="relative block aspect-[2/3] rounded-xl overflow-hidden bg-bg-card border border-white/5 group-hover:border-accent-blue/30 transition-colors">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted">
            <span className="text-3xl">🎬</span>
            <span className="text-xs">No poster</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle(); }}
          className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            item.is_favorite
              ? 'opacity-100 text-red-400 bg-black/50'
              : 'opacity-0 group-hover:opacity-100 text-white/70 hover:text-red-400 bg-black/50'
          }`}
        >
          <HeartIcon filled={item.is_favorite} className="w-4 h-4" />
        </button>

        <div className={`absolute top-2 right-2 transition-opacity ${isConfirming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isConfirming ? (
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
                className="px-2 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                Remove
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancelConfirm(); }}
                className="w-6 h-6 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-lg transition"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
              className="w-7 h-7 flex items-center justify-center bg-black/50 hover:bg-red-500/80 text-white rounded-lg transition"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {item.rating != null && Number(item.rating) > 0 && (
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <StarIcon className="w-3 h-3 text-accent-blue" />
            <span className="text-white text-xs font-semibold">{Number(item.rating).toFixed(1)}</span>
          </div>
        )}

        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-1">
            <StarRating rating={item.personal_rating} onRate={onRatingChange} />
          </div>
        </div>
      </Link>

      <div className="mt-2.5 px-0.5">
        <p className="text-text-primary text-sm font-semibold leading-tight truncate mb-1.5">{item.title}</p>
        {item.media_type === 'tv' && (
          <ProgressPicker
            tmdbId={item.tmdb_id}
            season={item.current_season}
            episode={item.current_episode}
            onChange={onProgressChange}
          />
        )}
        {/* Status pills — visible only on hover */}
        <div className={`flex gap-1 ${item.media_type === 'tv' ? 'mt-1.5' : ''} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {(['planning_to_watch', 'watching', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`flex-1 text-xs py-1 rounded-md font-medium transition-colors truncate ${
                item.status === s
                  ? 'bg-accent-blue text-white'
                  : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const GENRE_NAMES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 37: 'Western', 10759: 'Action & Adventure', 10762: 'Kids',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10768: 'War & Politics',
};

type TabType = 'all' | 'watching' | 'completed' | 'plantowatch';

interface WatchlistItem {
  id: number;
  show_id: number;
  tmdb_id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path?: string;
  rating?: number;
  personal_rating?: number | null;
  current_season?: number | null;
  current_episode?: number | null;
  genres?: number[] | null;
  is_favorite: boolean;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  watching: 'Watching',
  completed: 'Completed',
  planning_to_watch: 'Planned',
};


export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'added' | 'az' | 'za' | 'rating' | 'myrating'>('added');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [filterGenre, setFilterGenre] = useState<number | null>(null);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const toast = useToast();

  useEffect(() => { setConfirmingId(null); setFilterGenre(null); }, [activeTab]);

  useEffect(() => {
    if (confirmingId === null) return;
    const handleClick = () => setConfirmingId(null);
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setConfirmingId(null); };
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 0);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmingId]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/watchlist', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setWatchlist(json.data ?? []);
        }
      } catch (e) {
        console.error('Failed to load watchlist:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStatusChange = async (item: WatchlistItem, newStatus: string) => {
    setWatchlist((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, status: newStatus } : w))
    );
    try {
      const res = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tmdbId: item.tmdb_id, status: newStatus }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Update failed');
      }
      const data = await res.json();
      if (data.current_season !== undefined) {
        setWatchlist((prev) =>
          prev.map((w) => w.id === item.id ? { ...w, current_season: data.current_season, current_episode: data.current_episode } : w)
        );
      }
      toast(`Marked as ${STATUS_LABELS[newStatus]}`);
    } catch (e) {
      console.error('Failed to update status:', e);
      setWatchlist((prev) =>
        prev.map((w) => (w.id === item.id ? { ...w, status: item.status } : w))
      );
      toast('Failed to update status', 'error');
    }
  };

  const handleRatingChange = async (item: WatchlistItem, rating: number | null) => {
    setWatchlist((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, personal_rating: rating } : w))
    );
    try {
      const res = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tmdbId: item.tmdb_id, rating }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast(rating === null ? 'Rating cleared' : 'Rating saved');
    } catch (e) {
      console.error('Failed to update rating:', e);
      setWatchlist((prev) =>
        prev.map((w) => (w.id === item.id ? { ...w, personal_rating: item.personal_rating } : w))
      );
      toast('Failed to save rating', 'error');
    }
  };

  const handleFavoriteToggle = async (item: WatchlistItem) => {
    const newValue = !item.is_favorite;
    setWatchlist((prev) => prev.map((w) => (w.id === item.id ? { ...w, is_favorite: newValue } : w)));
    try {
      const res = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tmdbId: item.tmdb_id, is_favorite: newValue }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast(newValue ? 'Added to favorites' : 'Removed from favorites');
    } catch (e) {
      console.error('Failed to update favorite:', e);
      setWatchlist((prev) => prev.map((w) => (w.id === item.id ? { ...w, is_favorite: item.is_favorite } : w)));
      toast('Failed to update favorites', 'error');
    }
  };

  const handleProgressChange = async (item: WatchlistItem, season: number, episode: number) => {
    setWatchlist((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, current_season: season, current_episode: episode } : w))
    );
    try {
      const res = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tmdbId: item.tmdb_id, current_season: season, current_episode: episode }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast('Progress saved');
    } catch (e) {
      console.error('Failed to update progress:', e);
      setWatchlist((prev) =>
        prev.map((w) => (w.id === item.id ? { ...w, current_season: item.current_season, current_episode: item.current_episode } : w))
      );
      toast('Failed to save progress', 'error');
    }
  };

  const handleRemove = async (item: WatchlistItem) => {
    if (confirmingId !== item.id) {
      setConfirmingId(item.id);
      return;
    }
    setConfirmingId(null);
    try {
      const res = await fetch(`/api/watchlist?tmdbId=${item.tmdb_id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setWatchlist((prev) => prev.filter((w) => w.id !== item.id));
        toast(`Removed "${item.title}" from watchlist`);
      } else {
        toast('Failed to remove from watchlist', 'error');
      }
    } catch (e) {
      console.error('Failed to remove from watchlist:', e);
      toast('Failed to remove from watchlist', 'error');
    }
  };

  const tabItems = watchlist.filter((item) =>
    activeTab === 'all' ||
    (activeTab === 'watching' && item.status === 'watching') ||
    (activeTab === 'completed' && item.status === 'completed') ||
    (activeTab === 'plantowatch' && item.status === 'planning_to_watch')
  );

  const availableGenres = Array.from(
    new Set(tabItems.flatMap((item) => item.genres ?? []))
  ).filter((id) => GENRE_NAMES[id]).sort((a, b) => GENRE_NAMES[a].localeCompare(GENRE_NAMES[b]));

  const filteredList = watchlist
    .filter((item) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'watching' && item.status === 'watching') ||
        (activeTab === 'completed' && item.status === 'completed') ||
        (activeTab === 'plantowatch' && item.status === 'planning_to_watch');
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || item.media_type === filterType;
      const matchesGenre = filterGenre === null || (item.genres?.includes(filterGenre) ?? false);
      const matchesFavorite = !filterFavorites || item.is_favorite;
      return matchesTab && matchesSearch && matchesType && matchesGenre && matchesFavorite;
    })
    .sort((a, b) => {
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      if (sortBy === 'za') return b.title.localeCompare(a.title);
      if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sortBy === 'myrating') {
        const diff = (Number(b.personal_rating) || 0) - (Number(a.personal_rating) || 0);
        return diff !== 0 ? diff : (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
      return 0; // 'added' keeps the original order (already sorted by updated_at DESC from API)
    });

  const counts = {
    watching: watchlist.filter((w) => w.status === 'watching').length,
    completed: watchlist.filter((w) => w.status === 'completed').length,
    planning: watchlist.filter((w) => w.status === 'planning_to_watch').length,
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: watchlist.length },
    { id: 'watching', label: 'Watching', count: counts.watching },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'plantowatch', label: 'Planned', count: counts.planning },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="max-w-[1480px] mx-auto px-10 pt-8 pb-6 flex items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-1">My Watchlist</h1>
          <p className="text-text-muted text-sm">Track what you're watching and what's next</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="modern-panel rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="text-accent-blue text-sm">▶</span>
            <span className="text-2xl font-bold text-accent-blue">{counts.watching}</span>
            <span className="text-text-muted text-xs uppercase tracking-wider">Watching</span>
          </div>
          <div className="modern-panel rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="text-green-400 text-sm">✓</span>
            <span className="text-2xl font-bold text-green-400">{counts.completed}</span>
            <span className="text-text-muted text-xs uppercase tracking-wider">Completed</span>
          </div>
          <div className="modern-panel rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="text-sky-300 text-sm">☆</span>
            <span className="text-2xl font-bold text-sky-300">{counts.planning}</span>
            <span className="text-text-muted text-xs uppercase tracking-wider">Planned</span>
          </div>
          <div className="modern-panel rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="text-text-muted text-sm">#</span>
            <span className="text-2xl font-bold text-text-primary">{watchlist.length}</span>
            <span className="text-text-muted text-xs uppercase tracking-wider">Total</span>
          </div>
        </div>
      </div>

      {/* Tabs + toolbar */}
      <div className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-[1480px] mx-auto px-10 flex items-center justify-between gap-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-accent-blue text-accent-blue'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 text-xs rounded-full px-1.5 py-0.5 ${
                    activeTab === tab.id ? 'bg-accent-blue/20 text-accent-blue' : 'bg-white/5 text-text-muted'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search your list..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 bg-bg-card border border-white/10 rounded-xl px-4 py-2 pl-9 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 transition-colors"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">⌕</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-bg-card border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50 transition-colors cursor-pointer"
            >
              <option value="added">Recently Added</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="rating">Top Rated</option>
              <option value="myrating">My Rating</option>
            </select>
            {(searchQuery || filterType !== 'all' || filterGenre !== null || filterFavorites) && (
              <p className="text-text-muted text-sm whitespace-nowrap">
                {filteredList.length} result{filteredList.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[1480px] mx-auto px-10 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {(['all', 'movie', 'tv'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filterType === t
                  ? 'bg-accent-blue text-white'
                  : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary'
              }`}
            >
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/10" />
        <button
          onClick={() => setFilterFavorites((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            filterFavorites
              ? 'bg-red-400/15 text-red-400 border border-red-400/30'
              : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary border border-transparent'
          }`}
        >
          <HeartIcon filled={filterFavorites} className="w-3 h-3" />
          Favorites
        </button>

        {availableGenres.length > 0 && (
          <>
            <div className="w-px h-4 bg-white/10" />
            <select
              value={filterGenre ?? ''}
              onChange={(e) => setFilterGenre(e.target.value === '' ? null : Number(e.target.value))}
              className="bg-bg-card border border-white/10 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50 transition-colors cursor-pointer"
            >
              <option value="">All Genres</option>
              {availableGenres.map((id) => (
                <option key={id} value={id}>{GENRE_NAMES[id]}</option>
              ))}
            </select>
          </>
        )}
        {(filterGenre !== null || filterType !== 'all' || filterFavorites) && (
          <button
            onClick={() => { setFilterGenre(null); setFilterType('all'); setFilterFavorites(false); }}
            className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary rounded-lg transition-colors"
            title="Clear filters"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-[1480px] mx-auto px-10 py-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-bg-card animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="modern-panel rounded-2xl py-20 px-6 text-center">
            <p className="text-5xl mb-4">{searchQuery || filterGenre !== null || filterType !== 'all' || filterFavorites ? '🔍' : '🎬'}</p>
            <p className="text-text-primary font-semibold text-lg mb-1">
              {searchQuery ? `No results for "${searchQuery}"` : 'Nothing here yet'}
            </p>
            <p className="text-text-muted text-sm">
              {searchQuery || filterGenre !== null || filterType !== 'all' || filterFavorites
                ? 'Try adjusting your search or filters.'
                : activeTab === 'all'
                  ? 'Start adding movies and shows to your watchlist!'
                  : `No ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} titles yet.`}
            </p>
            {(filterGenre !== null || filterType !== 'all' || filterFavorites) && (
              <button
                onClick={() => { setFilterGenre(null); setFilterType('all'); setFilterFavorites(false); }}
                className="mt-4 text-xs text-accent-blue hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredList.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                isConfirming={confirmingId === item.id}
                onRemove={() => handleRemove(item)}
                onCancelConfirm={() => setConfirmingId(null)}
                onStatusChange={(status) => handleStatusChange(item, status)}
                onRatingChange={(rating) => handleRatingChange(item, rating)}
                onProgressChange={(s, e) => handleProgressChange(item, s, e)}
                onFavoriteToggle={() => handleFavoriteToggle(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
