'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgb(137 207 240 / 7%) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgb(96 165 250 / 5%) 0%, transparent 70%)' }} />
      </div>

      {/* Brand */}
      <div className="mb-9 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-accent-blue/15 border border-accent-blue/25 flex items-center justify-center text-accent-blue font-black text-sm">
          ▶
        </div>
        <span className="text-2xl font-bold tracking-tight text-text-primary">TrackUrShows</span>
      </div>

      <div className="w-full max-w-md auth-panel rounded-2xl overflow-hidden">
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent-blue/60 to-transparent" />

        <div className="px-9 py-9">
          <h1 className="mb-1.5 text-3xl font-bold text-text-primary">Create account</h1>
          <p className="mb-7 text-text-muted text-[15px]">Build your personalized media watchlist.</p>

          {error && (
            <div className="mb-5 p-4 bg-red-500/8 border border-red-500/25 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-text-muted text-xs font-semibold uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-input-border bg-input-bg px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent-blue/50 focus:outline-none focus:ring-2 focus:ring-accent-blue/15 transition-all"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-text-muted text-xs font-semibold uppercase tracking-widest mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Your username"
                className="w-full rounded-xl border border-input-border bg-input-bg px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent-blue/50 focus:outline-none focus:ring-2 focus:ring-accent-blue/15 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-text-muted text-xs font-semibold uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-input-border bg-input-bg px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent-blue/50 focus:outline-none focus:ring-2 focus:ring-accent-blue/15 transition-all"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-text-muted text-xs font-semibold uppercase tracking-widest mb-2">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-input-border bg-input-bg px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent-blue/50 focus:outline-none focus:ring-2 focus:ring-accent-blue/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-accent-blue py-3.5 font-bold text-bg-dark shadow-[0_8px_32px_rgba(137,207,240,0.22)] hover:shadow-[0_8px_40px_rgba(137,207,240,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-text-muted text-sm">
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
