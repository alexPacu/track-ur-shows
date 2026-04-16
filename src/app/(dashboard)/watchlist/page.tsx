'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { XIcon, StarIcon } from '@/components/Icons';

function WatchlistCard({
  item,
  isConfirming,
  onRemove,
  onCancelConfirm,
  onStatusChange,
}: {
  item: WatchlistItem;
  isConfirming: boolean;
  onRemove: () => void;
  onCancelConfirm: () => void;
  onStatusChange: (status: string) => void;
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

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isConfirming ? (
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.preventDefault(); onRemove(); }}
                className="px-2 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                Remove
              </button>
              <button
                onClick={(e) => { e.preventDefault(); onCancelConfirm(); }}
                className="w-6 h-6 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-lg transition"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); onRemove(); }}
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
      </Link>

      <div className="mt-2.5 px-0.5">
        <p className="text-text-primary text-sm font-semibold leading-tight truncate mb-2">{item.title}</p>
        {/* Status pills — visible only on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

type TabType = 'all' | 'watching' | 'completed' | 'plantowatch';

interface WatchlistItem {
  id: number;
  show_id: number;
  tmdb_id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path?: string;
  rating?: number;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  watching: 'Watching',
  completed: 'Completed',
  planning_to_watch: 'Planned',
};

const STATUS_COLORS: Record<string, string> = {
  watching: 'text-accent-blue bg-accent-blue/15 border-accent-blue/30',
  completed: 'text-green-400 bg-green-400/15 border-green-400/30',
  planning_to_watch: 'text-blue-300 bg-blue-400/15 border-blue-400/30',
};

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'added' | 'az' | 'za' | 'rating'>('added');

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
      await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tmdbId: item.tmdb_id, status: newStatus }),
      });
    } catch (e) {
      console.error('Failed to update status:', e);
      setWatchlist((prev) =>
        prev.map((w) => (w.id === item.id ? { ...w, status: item.status } : w))
      );
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
      }
    } catch (e) {
      console.error('Failed to remove from watchlist:', e);
    }
  };

  const filteredList = watchlist
    .filter((item) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'watching' && item.status === 'watching') ||
        (activeTab === 'completed' && item.status === 'completed') ||
        (activeTab === 'plantowatch' && item.status === 'planning_to_watch');
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      if (sortBy === 'za') return b.title.localeCompare(a.title);
      if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
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
      <div className="max-w-[1480px] mx-auto px-10 pt-8 pb-10">
        <h1 className="text-4xl font-bold text-text-primary mb-1">My Watchlist</h1>
        <p className="text-text-muted">Track what you're watching and what's next</p>

        {/* Stats */}
        <div className="mt-8 flex gap-4">
          <div className="flex-1 modern-panel rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/15 flex items-center justify-center">
              <span className="text-accent-blue text-lg">▶</span>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-0.5">Watching</p>
              <p className="text-2xl font-bold text-accent-blue">{counts.watching}</p>
            </div>
          </div>
          <div className="flex-1 modern-panel rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-400/15 flex items-center justify-center">
              <span className="text-green-400 text-lg">✓</span>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-0.5">Completed</p>
              <p className="text-2xl font-bold text-green-400">{counts.completed}</p>
            </div>
          </div>
          <div className="flex-1 modern-panel rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-400/15 flex items-center justify-center">
              <span className="text-blue-300 text-lg">☆</span>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-0.5">Planned</p>
              <p className="text-2xl font-bold text-blue-300">{counts.planning}</p>
            </div>
          </div>
          <div className="flex-1 modern-panel rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <span className="text-text-muted text-lg">#</span>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-0.5">Total</p>
              <p className="text-2xl font-bold text-text-primary">{watchlist.length}</p>
            </div>
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
            </select>
            {searchQuery && (
              <p className="text-text-muted text-sm whitespace-nowrap">
                {filteredList.length} result{filteredList.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
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
            <p className="text-5xl mb-4">🎬</p>
            <p className="text-text-primary font-semibold text-lg mb-1">Nothing here yet</p>
            <p className="text-text-muted text-sm">
              {activeTab === 'all'
                ? 'Start adding movies and shows to your watchlist!'
                : `No ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} titles yet.`}
            </p>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
