'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  DonutChart,
  RatingHistogram,
  PosterCard,
  ActivityHeatmap,
  TMDB_GENRES,
  STATUS_LABELS,
  STATUS_COLORS,
  CHART_COLORS,
  formatDuration,
  type StatsData,
  type ChartsData,
  type ChartItem,
  type ChartTab,
} from '@/components/profile/Charts';

interface PublicProfile {
  id: number;
  username: string;
  profile_picture_url: string | null;
  background_image_url: string | null;
  created_at: string;
}

interface ProfileResponse {
  user: PublicProfile;
  counts: { followers: number; following: number };
  isFollowing: boolean;
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<PublicProfile | null>(null);
  const [counts, setCounts] = useState<{ followers: number; following: number }>({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [viewerId, setViewerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [chartTab, setChartTab] = useState<ChartTab>('genres');
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [profileRes, statsRes, chartsRes, meRes] = await Promise.all([
        fetch(`/api/users/${username}`, { credentials: 'include' }),
        fetch(`/api/users/${username}/stats`, { credentials: 'include' }),
        fetch(`/api/users/${username}/charts`, { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' }),
      ]);

      if (!profileRes.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const profileJson: ProfileResponse & { success: true } = await profileRes.json();
      setUser(profileJson.user);
      setCounts(profileJson.counts);
      setIsFollowing(profileJson.isFollowing);

      if (statsRes.ok) {
        const j = await statsRes.json();
        setStats(j.stats);
      }
      if (chartsRes.ok) {
        const j = await chartsRes.json();
        if (j.success) setCharts(j);
      }
      if (meRes.ok) {
        const me = await meRes.json();
        setViewerId(me.user?.id ?? null);
      }

      setLoading(false);
    };
    load();
  }, [username]);

  const handleFollow = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${user.id}/follow`, { method, credentials: 'include' });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setCounts((c) => ({ ...c, followers: c.followers + (isFollowing ? -1 : 1) }));
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-text-muted text-lg">User not found.</p>
        <Link href="/dashboard" className="text-accent-blue hover:underline text-sm">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const memberYear = new Date(user.created_at).getFullYear();
  const total = stats?.total ?? 0;
  const isOwnProfile = viewerId === user.id;
  const canFollow = viewerId !== null && !isOwnProfile;

  const neutral = { color: 'text-text-primary', accent: 'bg-white/5 border-white/10' };
  const statCards = [
    { label: 'Total', value: total, ...neutral },
    {
      label: 'Mean Score',
      value: stats?.avg_personal_rating != null ? `${stats.avg_personal_rating}/10` : '—',
      ...neutral,
    },
    {
      label: 'Watch Time',
      value: formatDuration(stats?.total_minutes_watched ?? 0),
      color: 'text-accent-blue',
      accent: 'bg-accent-blue/10 border-accent-blue/20',
    },
  ];

  const genreItems: ChartItem[] = (charts?.genres ?? []).map((g, i) => ({
    label: TMDB_GENRES[g.genreId] ?? `Genre ${g.genreId}`,
    count: g.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const providerItems: ChartItem[] = (charts?.providers ?? []).map((p, i) => ({
    label: p.name,
    count: p.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const statusItems: ChartItem[] = (charts?.statuses ?? []).map((s) => ({
    label: STATUS_LABELS[s.status] ?? s.status,
    count: s.count,
    color: STATUS_COLORS[s.status] ?? '#888',
  }));

  const chartTabs: { key: ChartTab; label: string }[] = [
    { key: 'genres', label: 'Genres' },
    { key: 'providers', label: 'Providers' },
    { key: 'status', label: 'Status' },
    { key: 'ratings', label: 'Ratings' },
  ];

  return (
    <div className="min-h-screen pb-24">
      <div className="relative h-60 overflow-hidden">
        {user.background_image_url ? (
          <img src={user.background_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-blue/25 via-bg-dark/60 to-bg-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-bg-dark" />
      </div>

      <div className="relative z-10 max-w-[1480px] mx-auto px-10">
        <div className="flex items-end justify-between -mt-16 mb-10">
          <div className="flex items-end gap-5">
            <div className="w-32 h-32 rounded-full border-4 border-bg-dark overflow-hidden bg-accent-blue/20 flex items-center justify-center text-5xl font-bold text-accent-blue shadow-xl flex-shrink-0">
              {user.profile_picture_url ? (
                <img src={user.profile_picture_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span>{user.username[0]?.toUpperCase()}</span>
              )}
            </div>

            <div className="pb-2">
              <h1 className="text-4xl font-bold text-text-primary tracking-tight">{user.username}</h1>
              <p className="text-text-muted text-sm mt-1.5">Member since {memberYear}</p>
            </div>
          </div>

          {canFollow && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`mb-2 px-5 py-2 text-sm font-semibold rounded-xl border transition-colors disabled:opacity-50 ${
                isFollowing
                  ? 'border-white/20 text-text-muted hover:border-red-500/50 hover:text-red-400'
                  : 'border-accent-blue bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25'
              }`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{counts.followers}</p>
            <p className="text-text-muted text-xs uppercase tracking-widest font-semibold">Followers</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{counts.following}</p>
            <p className="text-text-muted text-xs uppercase tracking-widest font-semibold">Following</p>
          </div>
        </div>

        {total > 0 && stats && (
          <div className="modern-panel rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-0.5 h-4 rounded-full bg-accent-blue" style={{ boxShadow: '0 0 8px rgba(137,207,240,0.5)' }} />
              <p className="text-text-primary text-sm font-semibold tracking-tight">Library breakdown</p>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              {stats.watching > 0 && (
                <div className="bg-blue-400 rounded-l-full transition-all" style={{ width: `${(stats.watching / total) * 100}%` }} />
              )}
              {stats.completed > 0 && (
                <div className="bg-green-400 transition-all" style={{ width: `${(stats.completed / total) * 100}%` }} />
              )}
              {stats.planned > 0 && (
                <div className="bg-sky-300 rounded-r-full transition-all" style={{ width: `${(stats.planned / total) * 100}%` }} />
              )}
            </div>
            <div className="flex gap-6 mt-4">
              {[
                { label: 'Watching', color: 'bg-blue-400', count: stats.watching },
                { label: 'Completed', color: 'bg-green-400', count: stats.completed },
                { label: 'Planned', color: 'bg-sky-300', count: stats.planned },
              ].filter((s) => s.count > 0).map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-text-muted text-sm">{s.label}</span>
                  <span className="text-text-primary text-sm font-semibold">{s.count}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-text-muted text-sm">Movies</span>
                <span className="text-text-primary text-sm font-semibold">{stats.movies}</span>
                <span className="text-text-muted text-sm ml-3">TV Shows</span>
                <span className="text-text-primary text-sm font-semibold">{stats.tv_shows}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={`modern-panel rounded-2xl p-6 flex flex-col items-center justify-center gap-2 border ${s.accent}`}
            >
              <p className={`text-4xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
              <p className="text-text-muted text-[10px] uppercase tracking-widest font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        {charts && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-0.5 h-4 rounded-full bg-accent-blue" style={{ boxShadow: '0 0 8px rgba(137,207,240,0.5)' }} />
                <p className="text-text-primary text-sm font-semibold tracking-tight">Recent activity</p>
              </div>
              <button
                onClick={() => setShowHeatmap((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  showHeatmap
                    ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/25'
                    : 'bg-white/[0.05] text-text-muted border border-white/[0.06] hover:text-text-primary hover:bg-white/[0.08]'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 5h10" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Heatmap
              </button>
            </div>

            {showHeatmap ? (
              <div className="modern-panel rounded-2xl p-5">
                <ActivityHeatmap data={charts.heatmap ?? []} />
              </div>
            ) : charts.activity.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {charts.activity.map((item, i) => (
                  <PosterCard
                    key={i}
                    title={item.title}
                    posterPath={item.poster_path}
                    status={item.status}
                    personalRating={item.personal_rating}
                    timestamp={item.updated_at}
                    tmdbId={item.tmdb_id}
                    mediaType={item.media_type}
                  />
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm py-4">No recent activity yet.</p>
            )}
          </div>
        )}

        {charts && charts.favorites.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-0.5 h-4 rounded-full bg-accent-blue" style={{ boxShadow: '0 0 8px rgba(137,207,240,0.5)' }} />
              <p className="text-text-primary text-sm font-semibold tracking-tight">Favorites</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {charts.favorites.map((item, i) => (
                <PosterCard
                  key={i}
                  title={item.title}
                  posterPath={item.poster_path}
                  status={item.status}
                  personalRating={item.personal_rating}
                  tmdbId={item.tmdb_id}
                  mediaType={item.media_type}
                />
              ))}
            </div>
          </div>
        )}

        {charts && (
          <div className="modern-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-2.5">
                <div className="w-0.5 h-5 rounded-full bg-accent-blue" style={{ boxShadow: '0 0 8px rgba(137,207,240,0.5)' }} />
                <p className="text-text-primary text-base font-semibold tracking-tight">Statistics</p>
              </div>
              <div className="flex gap-0.5 p-0.5 bg-white/[0.04] rounded-xl border border-white/[0.07]">
                {chartTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setChartTab(tab.key)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      chartTab === tab.key
                        ? 'bg-accent-blue/12 text-accent-blue border border-accent-blue/20'
                        : 'text-text-muted hover:text-text-primary border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {chartTab === 'ratings' ? (
              <RatingHistogram data={charts.ratingDistribution} />
            ) : chartTab === 'providers' && providerItems.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-10">
                No provider data — providers are linked when shows are fetched from TMDB.
              </p>
            ) : (
              <DonutChart
                items={
                  chartTab === 'genres' ? genreItems :
                  chartTab === 'providers' ? providerItems :
                  statusItems
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
