'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUserName(data.user?.username);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-16 overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `repeating-radial-gradient(
            circle at 50% 45%,
            transparent 0px,
            transparent 80px,
            rgba(137, 207, 240, 0.022) 80px,
            rgba(137, 207, 240, 0.022) 82px
          )`,
        }}
        aria-hidden="true"
      />

      {isLoggedIn ? (
        <div className="space-y-6 text-center">
          <p className="text-lg text-text-primary">
            Welcome back, <span className="text-accent-blue font-semibold">{userName}</span>.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-full bg-accent-blue px-8 py-3 font-bold text-bg-dark shadow-[0_8px_24px_rgba(137,207,240,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(137,207,240,0.42)] transition-all"
          >
            Go to Dashboard →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-10 text-center">
          <div className="border-2 border-accent-blue px-10 py-6 md:px-16 md:py-8 shadow-[0_0_60px_rgba(137,207,240,0.08),inset_0_0_60px_rgba(137,207,240,0.03)]">
            <h1 className="text-4xl font-medium tracking-[0.18em] uppercase text-text-primary md:text-6xl lg:text-7xl">
              TrackUrShows
            </h1>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-text-muted">
            Your shows. Your list.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link
              href="/login"
              className="rounded-full bg-accent-blue px-10 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-bg-dark shadow-[0_8px_24px_rgba(137,207,240,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(137,207,240,0.48)] transition-all"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-accent-blue/60 px-10 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-accent-blue shadow-[0_8px_24px_rgba(137,207,240,0.1)] hover:-translate-y-0.5 hover:border-accent-blue hover:shadow-[0_12px_32px_rgba(137,207,240,0.22)] transition-all"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
