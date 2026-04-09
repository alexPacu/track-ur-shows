'use client';

import { useState } from 'react';
import Image from 'next/image';
import { DeleteIcon, StarIcon } from '@/components/Icons';

type TabType = 'all' | 'watching' | 'completed' | 'plantowatch';

interface WatchlistItem {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  poster_url?: string;
  rating?: number;
  genres?: string[];
  watched: number;
  total: number;
}

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  const tabs: { id: TabType; label: string; count: number }[] = [
    {
      id: 'all',
      label: 'All',
      count: watchlist.length,
    },
    {
      id: 'watching',
      label: 'Watching',
      count: watchlist.filter((w) => w.watched < w.total).length,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: watchlist.filter((w) => w.watched === w.total).length,
    },
    {
      id: 'plantowatch',
      label: 'Plan to Watch',
      count: 0,
    },
  ];

  const handleRemove = (id: number) => {
    setWatchlist(watchlist.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[1480px] mx-auto px-10 py-16">
        <h1 className="text-4xl font-bold text-text-primary mb-2">My Watchlist</h1>
        <p className="text-text-muted">Keep track of shows and movies you want to watch</p>

        <div className="mt-10 grid grid-cols-3 gap-6">
          <div className="modern-panel rounded-xl p-6">
            <p className="text-text-muted text-sm mb-2">Watching</p>
            <p className="text-4xl font-bold text-accent-blue">
              {watchlist.filter((w) => w.watched < w.total).length}
            </p>
          </div>
          <div className="modern-panel rounded-xl p-6">
            <p className="text-text-muted text-sm mb-2">Completed</p>
            <p className="text-4xl font-bold text-green-400">
              {watchlist.filter((w) => w.watched === w.total).length}
            </p>
          </div>
          <div className="modern-panel rounded-xl p-6">
            <p className="text-text-muted text-sm mb-2">Plan to Watch</p>
            <p className="text-4xl font-bold text-blue-400">0</p>
          </div>
        </div>
      </div>

      <div className="border-y border-accent-blue/20 bg-bg-card/20">
        <div className="max-w-[1480px] mx-auto px-10">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 font-semibold whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-accent-blue text-accent-blue'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 text-sm bg-accent-blue/20 text-accent-blue rounded-full px-2">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1480px] mx-auto px-10 py-12">
        {watchlist.length === 0 ? (
          <div className="modern-panel rounded-xl py-16 px-6 text-center">
            <p className="text-text-muted text-lg">No items in your watchlist yet</p>
            <p className="text-text-muted text-sm mt-2">Start adding movies and shows to track them!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {watchlist.map((item) => {
              const percentage = (item.watched / item.total) * 100;

              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-bg-card border border-accent-blue/20 rounded-lg hover:border-accent-blue/40 transition group"
                >
                  <div className="relative w-24 h-36 rounded-lg bg-bg-dark flex-shrink-0">
                    {item.poster_url ? (
                      <Image
                        src={item.poster_url}
                        alt={item.title}
                        fill
                        className="object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-text-muted text-xs">No image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-text-primary font-semibold truncate">{item.title}</h3>
                        <p className="text-text-muted text-xs capitalize">{item.type}</p>
                      </div>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-4 h-4 text-accent-blue" />
                          <span className="text-text-primary text-sm">{item.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {item.genres && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {item.genres.map((genre) => (
                          <span
                            key={genre}
                            className="text-xs bg-accent-blue/10 text-accent-blue px-2 py-1 rounded"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-text-muted text-xs">
                          {item.watched} / {item.total} {item.type === 'tv' ? 'episodes' : 'watched'}
                        </span>
                        <span className="text-text-muted text-xs">{Math.round(percentage)}%</span>
                      </div>
                      <div className="w-full bg-bg-dark rounded-full h-2">
                        <div
                          className="bg-accent-blue h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                  >
                    <DeleteIcon className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
