'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SearchIcon, BookmarkIcon, UserIcon } from './Icons';

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-50 border-b border-accent-blue/20 bg-bg-dark/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between px-10">
        <Link href="/dashboard" className="flex items-center hover:opacity-85 transition">
          <span className="text-2xl font-bold tracking-tight text-text-primary">TrackUrShows</span>
        </Link>

        <div className="mx-10 flex max-w-md flex-1">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Search movies & shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-accent-blue/30 bg-bg-card/85 px-4 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
            />
            <SearchIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard/watchlist"
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-text-muted hover:bg-accent-blue/10 hover:text-accent-blue"
          >
            <BookmarkIcon className="h-4 w-4" />
            <span className="text-sm">Watchlist</span>
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-text-muted hover:bg-accent-blue/10 hover:text-accent-blue"
          >
            <UserIcon className="h-4 w-4" />
            <span className="text-sm">Profile</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
