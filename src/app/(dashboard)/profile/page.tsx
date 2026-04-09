'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const profileStats = [
    { label: 'Total Content', value: '—', color: 'text-accent-blue' },
    { label: 'Episodes Watched', value: '—', color: 'text-blue-400' },
    { label: 'Days Watched', value: '—', color: 'text-green-400' },
    { label: 'Mean Score', value: '—', color: 'text-yellow-400' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      sessionStorage.removeItem('authed');
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-primary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <p className="text-text-primary">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[1480px] mx-auto px-10 py-14">
        <div className="relative overflow-hidden rounded-2xl border border-accent-blue/25 shadow-[0_10px_28px_rgba(0,0,0,0.35)]">
          <div className="h-48 bg-gradient-to-r from-accent-blue/30 to-bg-dark"></div>

          <div className="px-8 pb-8 -mt-10">
            <div className="flex items-start justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="h-24 w-24 rounded-full bg-accent-blue/20 border-4 border-bg-dark flex items-center justify-center text-4xl font-bold text-accent-blue">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-text-primary">{user.username}</h1>
                  <p className="text-text-muted mt-2">Member since {new Date().getFullYear()}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-10 px-6 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-4 gap-6">
          {profileStats.map((stat) => (
            <div key={stat.label} className="modern-panel rounded-xl p-6 text-center">
              <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-text-muted text-sm mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
