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
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md modern-panel rounded-2xl p-7">
        <h1 className="mb-1 text-center text-2xl font-bold text-text-primary">Create Account</h1>
        <p className="mb-6 text-center text-sm text-text-muted">Join and build your personalized media watchlist.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label htmlFor="username" className="block text-text-primary text-sm font-semibold mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Your username"
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

          <div>
            <label htmlFor="confirmPassword" className="block text-text-primary text-sm font-semibold mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-accent-blue/30 bg-bg-dark px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-accent-blue py-2.5 font-semibold text-bg-dark shadow-[0_8px_20px_rgba(137,207,240,0.2)] hover:-translate-y-0.5 hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-text-muted text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-blue hover:text-blue-400 transition font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
