'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PosterMosaic from '@/components/PosterMosaic';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, confirmPassword }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-[55%] relative flex-col justify-between p-10 overflow-hidden">
        <PosterMosaic />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/15 border border-accent-blue/25 flex items-center justify-center text-accent-blue font-black text-xs">
            ▶
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">TrackUrShows</span>
        </Link>

        <p className="relative z-10 text-[10px] uppercase tracking-[0.35em] text-text-muted">
          Your shows. Your list.
        </p>
      </div>

      <div className="w-full md:w-[45%] flex flex-col justify-center px-8 py-12 md:px-12 lg:px-16 border-l border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 mb-10 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/15 border border-accent-blue/25 flex items-center justify-center text-accent-blue font-black text-xs">
            ▶
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">TrackUrShows</span>
        </Link>

        <div className="max-w-xs w-full mx-auto md:mx-0">
          <h1 className="mb-1 text-3xl font-bold text-text-primary">Create account</h1>
          <p className="mb-9 text-text-muted text-sm">Build your personalized media watchlist.</p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-transparent border-0 border-b border-input-border px-0 py-2 text-text-primary placeholder-text-muted/50 focus:border-accent-blue/60 focus:outline-none focus-visible:outline-none focus:ring-0 transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Your username"
                className="w-full bg-transparent border-0 border-b border-input-border px-0 py-2 text-text-primary placeholder-text-muted/50 focus:border-accent-blue/60 focus:outline-none focus-visible:outline-none focus:ring-0 transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-transparent border-0 border-b border-input-border px-0 py-2 text-text-primary placeholder-text-muted/50 focus:border-accent-blue/60 focus:outline-none focus-visible:outline-none focus:ring-0 transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-transparent border-0 border-b border-input-border px-0 py-2 text-text-primary placeholder-text-muted/50 focus:border-accent-blue/60 focus:outline-none focus-visible:outline-none focus:ring-0 transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-accent-blue py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-bg-dark shadow-[0_8px_24px_rgba(137,207,240,0.25)] hover:shadow-[0_8px_36px_rgba(137,207,240,0.42)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-7 text-text-muted text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-blue hover:text-blue-300 transition font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
