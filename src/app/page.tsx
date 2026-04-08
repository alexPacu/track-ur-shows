'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUserName(data.user?.username);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-5xl modern-panel rounded-3xl px-8 py-10 md:px-16 md:py-14">
        {isLoggedIn ? (
          <div className="space-y-6 text-center">
            <p className="text-lg text-text-primary">
              Welcome back, <span className="text-accent-blue font-semibold">{userName}</span>.
            </p>
            <Link
              href="/dashboard"
              className="inline-block rounded-xl bg-accent-blue px-8 py-3 font-semibold text-bg-dark shadow-[0_8px_20px_rgba(137,207,240,0.2)] hover:-translate-y-0.5 hover:bg-blue-300"
            >
              Go to Dashboard →
            </Link>
          </div>
        ) : (
          <div className="mx-auto flex min-h-[460px] max-w-4xl flex-col items-center justify-center gap-16 py-6">
            <div className="w-full max-w-3xl rounded-[36px] border border-accent-blue/60 bg-bg-card/35 px-8 py-10 text-center shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
              <h1 className="text-6xl font-bold tracking-tight text-text-primary md:text-7xl">
                TrackUrShows
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              <Link
                href="/login"
                className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-accent-blue px-12 py-4 text-2xl font-bold text-bg-dark shadow-[0_10px_24px_rgba(137,207,240,0.24)] hover:-translate-y-0.5 hover:bg-blue-300"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border-2 border-accent-blue/80 bg-accent-blue/5 px-12 py-4 text-2xl font-bold text-accent-blue hover:-translate-y-0.5 hover:bg-accent-blue/12"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
