'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { SearchIcon, BookmarkIcon, UserIcon } from './Icons';

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

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

        <div className="mx-10 flex max-w-md flex-1">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Search movies & shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-white/[0.07] bg-bg-card/60 px-4 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted focus:border-accent-blue/40 focus:outline-none focus:ring-2 focus:ring-accent-blue/12 transition-all"
            />
            <SearchIcon className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          </div>
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
