'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-xl modern-panel rounded-2xl p-9">
        <h1 className="mb-2 text-center text-3xl font-bold text-text-primary">Welcome Back</h1>
        <p className="mb-9 text-center text-lg text-text-muted">Sign in to continue tracking your shows.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-text-primary text-sm font-semibold mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-accent-blue/30 bg-bg-dark px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-text-primary text-sm font-semibold mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-accent-blue/30 bg-bg-dark px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-accent-blue py-3 font-semibold text-bg-dark shadow-[0_8px_20px_rgba(137,207,240,0.2)] hover:-translate-y-0.5 hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-text-muted">
          Don't have an account?{' '}
          <Link href="/register" className="text-accent-blue hover:text-blue-400 transition font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
