'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  profile_picture_url: string | null;
  background_image_url: string | null;
  bio: string | null;
  created_at: string;
}

interface StatsData {
  total: number;
  watching: number;
  completed: number;
  planned: number;
  movies: number;
  tv_shows: number;
  avg_personal_rating: number | null;
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'pfp' | 'bg' | null>(null);
  const toast = useToast();
  const pfpInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = () => {
    fetch('/api/profile', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => { setUser(data.user); setStats(data.stats); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
    const onFocus = () => fetchProfile();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleImageDelete = async (field: 'profile_picture_url' | 'background_image_url', type: 'pfp' | 'bg') => {
    setSaving(type);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [field]: null }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setUser((prev) => prev ? { ...prev, [field]: null } : prev);
      toast('Image removed');
    } catch (e) {
      console.error('Failed to delete image:', e);
      toast('Failed to remove image', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleImageUpload = async (
    file: File,
    field: 'profile_picture_url' | 'background_image_url',
    type: 'pfp' | 'bg'
  ) => {
    setSaving(type);
    try {
      const dataUrl = await toDataUrl(file);
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [field]: dataUrl }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Upload failed');
      }
      setUser((prev) => prev ? { ...prev, [field]: dataUrl } : prev);
      toast('Image updated');
    } catch (e: any) {
      console.error('Failed to upload image:', e);
      toast(e?.message ?? 'Failed to upload image', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    sessionStorage.removeItem('authed');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const memberYear = new Date(user.created_at).getFullYear();

  const neutral = { color: 'text-text-primary', accent: 'bg-white/5 border-white/10' };

  const statCards = [
    { label: 'Total', value: stats?.total ?? 0, ...neutral },
    { label: 'Watching', value: stats?.watching ?? 0, color: 'text-blue-400', accent: 'bg-blue-400/10 border-blue-400/20' },
    { label: 'Completed', value: stats?.completed ?? 0, color: 'text-green-400', accent: 'bg-green-400/10 border-green-400/20' },
    { label: 'Planned', value: stats?.planned ?? 0, color: 'text-sky-300', accent: 'bg-sky-300/10 border-sky-300/20' },
    { label: 'Movies', value: stats?.movies ?? 0, ...neutral },
    { label: 'TV Shows', value: stats?.tv_shows ?? 0, ...neutral },
    {
      label: 'Mean Score',
      value: stats?.avg_personal_rating != null ? `${stats.avg_personal_rating}/10` : '—',
      ...neutral,
    },
  ];

  const total = stats?.total ?? 0;

  return (
    <div className="min-h-screen pb-24">
      {/* Banner */}
      <div className="relative h-60 group/banner overflow-hidden">
        {user.background_image_url ? (
          <img
            src={user.background_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-blue/25 via-bg-dark/60 to-bg-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-bg-dark" />

        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover/banner:opacity-100 transition-opacity pointer-events-none group-hover/banner:pointer-events-auto">
          <button
            onClick={() => bgInputRef.current?.click()}
            disabled={saving === 'bg'}
            className="flex items-center gap-2 px-4 py-2.5 bg-black/60 backdrop-blur-sm text-white text-sm font-medium rounded-xl border border-white/20 hover:bg-black/70 transition-colors"
          >
            {saving === 'bg' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-base">🖼</span>
            )}
            Change Background
          </button>
          {user.background_image_url && (
            <button
              onClick={() => handleImageDelete('background_image_url', 'bg')}
              disabled={saving === 'bg'}
              className="flex items-center gap-2 px-4 py-2.5 bg-black/60 backdrop-blur-sm text-red-400 text-sm font-medium rounded-xl border border-red-500/30 hover:bg-red-500/20 transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, 'background_image_url', 'bg');
            e.target.value = '';
          }}
        />
      </div>

      <div className="max-w-[1480px] mx-auto px-10">
        {/* Avatar + identity row */}
        <div className="flex items-end justify-between -mt-16 mb-10">
          <div className="flex items-end gap-5">
            <div className="relative group/avatar shrink-0">
              <div className="w-32 h-32 rounded-full border-4 border-bg-dark overflow-hidden bg-accent-blue/20 flex items-center justify-center text-5xl font-bold text-accent-blue shadow-xl">
                {user.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.username[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center gap-2 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                {saving === 'pfp' ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <button
                      onClick={() => pfpInputRef.current?.click()}
                      className="text-white text-xl hover:scale-110 transition-transform"
                      title="Change photo"
                    >
                      📷
                    </button>
                    {user.profile_picture_url && (
                      <button
                        onClick={() => handleImageDelete('profile_picture_url', 'pfp')}
                        className="text-red-400 text-xs font-semibold hover:text-red-300 transition-colors"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    )}
                  </>
                )}
              </div>
              <input
                ref={pfpInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'profile_picture_url', 'pfp');
                  e.target.value = '';
                }}
              />
            </div>

            <div className="pb-2">
              <h1 className="text-3xl font-bold text-text-primary">{user.username}</h1>
              <p className="text-text-muted text-sm mt-1">Member since {memberYear}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mb-2 px-5 py-2 text-sm bg-red-600/15 text-red-400 border border-red-600/35 rounded-xl hover:bg-red-600/25 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={`modern-panel rounded-2xl p-5 flex flex-col items-center justify-center gap-1.5 border ${s.accent}`}
            >
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-text-muted text-xs uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        {total > 0 && (
          <div className="modern-panel rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-4">Library breakdown</p>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              {(stats!.watching > 0) && (
                <div
                  className="bg-blue-400 rounded-l-full transition-all"
                  style={{ width: `${(stats!.watching / total) * 100}%` }}
                />
              )}
              {(stats!.completed > 0) && (
                <div
                  className="bg-green-400 transition-all"
                  style={{ width: `${(stats!.completed / total) * 100}%` }}
                />
              )}
              {(stats!.planned > 0) && (
                <div
                  className="bg-sky-300 rounded-r-full transition-all"
                  style={{ width: `${(stats!.planned / total) * 100}%` }}
                />
              )}
            </div>
            <div className="flex gap-6 mt-4">
              {[
                { label: 'Watching', color: 'bg-blue-400', count: stats!.watching },
                { label: 'Completed', color: 'bg-green-400', count: stats!.completed },
                { label: 'Planned', color: 'bg-sky-300', count: stats!.planned },
              ].filter((s) => s.count > 0).map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-text-muted text-sm">{s.label}</span>
                  <span className="text-text-primary text-sm font-semibold">{s.count}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-text-muted text-sm">Movies</span>
                <span className="text-text-primary text-sm font-semibold">{stats!.movies}</span>
                <span className="text-text-muted text-sm ml-3">TV Shows</span>
                <span className="text-text-primary text-sm font-semibold">{stats!.tv_shows}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
