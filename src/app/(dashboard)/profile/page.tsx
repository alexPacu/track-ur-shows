'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  total_minutes_watched: number;
}

interface ActivityItem {
  tmdb_id: number;
  title: string;
  media_type: string;
  poster_path: string | null;
  status: string;
  personal_rating: number | null;
  updated_at: string;
}

interface FavoriteItem {
  tmdb_id: number;
  title: string;
  media_type: string;
  poster_path: string | null;
  status: string;
  personal_rating: number | null;
}

interface ChartsData {
  genres: { genreId: number; count: number }[];
  providers: { name: string; logoPath: string | null; count: number }[];
  activity: ActivityItem[];
  statuses: { status: string; count: number }[];
  favorites: FavoriteItem[];
  ratingDistribution: { rating: number; count: number }[];
}

const TMDB_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};

const STATUS_LABELS: Record<string, string> = {
  watching: 'Watching',
  completed: 'Completed',
  planning_to_watch: 'Planned',
};

const STATUS_COLORS: Record<string, string> = {
  watching: '#60a5fa',
  completed: '#34d399',
  planning_to_watch: '#7dd3fc',
};

const STATUS_BADGE: Record<string, string> = {
  watching: 'bg-blue-400/15 text-blue-300 border-blue-400/25',
  completed: 'bg-green-400/15 text-green-300 border-green-400/25',
  planning_to_watch: 'bg-sky-300/15 text-sky-300 border-sky-300/25',
};

const CHART_COLORS = [
  '#89CFF0', '#60a5fa', '#34d399', '#a78bfa', '#f472b6',
  '#fb923c', '#facc15', '#f87171', '#2dd4bf', '#818cf8',
];

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function tmdbPoster(path: string | null): string | null {
  return path ? `https://image.tmdb.org/t/p/w185${path}` : null;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return '—';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

// circle cahrt
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, outerR: number, innerR: number, a1: number, a2: number) {
  const s = polar(cx, cy, outerR, a1);
  const e = polar(cx, cy, outerR, a2);
  const si = polar(cx, cy, innerR, a1);
  const ei = polar(cx, cy, innerR, a2);
  const large = a2 - a1 > 180 ? 1 : 0;
  return [
    `M${s.x},${s.y}`,
    `A${outerR},${outerR} 0 ${large} 1 ${e.x},${e.y}`,
    `L${ei.x},${ei.y}`,
    `A${innerR},${innerR} 0 ${large} 0 ${si.x},${si.y}`,
    'Z',
  ].join(' ');
}

interface ChartItem { label: string; count: number; color: string; }

function DonutChart({ items }: { items: ChartItem[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = items.reduce((s, i) => s + i.count, 0);

  if (total === 0) {
    return <p className="text-text-muted text-sm text-center py-10">No data yet</p>;
  }

  const CX = 100, CY = 100, OR = 78, IR = 50, GAP = 1.8;
  let angle = 0;
  const slices = items.map((item) => {
    const sweep = (item.count / total) * (360 - GAP * items.length);
    const start = angle;
    angle += sweep + GAP;
    return { ...item, start, end: start + sweep };
  });

  const active = hovered !== null ? items[hovered] : null;

  return (
    <div className="flex items-center gap-8">
      <svg width="200" height="200" viewBox="0 0 200 200" className="shrink-0">
        {slices.map((s, i) => (
          <path
            key={i}
            d={arcPath(CX, CY, OR, IR, s.start, s.end)}
            fill={s.color}
            opacity={hovered === null || hovered === i ? 1 : 0.3}
            className="cursor-pointer transition-opacity duration-150"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <text x={CX} y={CY - 7} textAnchor="middle" fontSize="20" fontWeight="700" fill="#f5f5f5">
          {active ? active.count : total}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="9.5" fill="#b0b0b0">
          {active ? active.label : 'Total'}
        </text>
      </svg>

      <div className="flex flex-col gap-2 flex-1 min-w-0 max-h-[200px] overflow-y-auto pr-1">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 cursor-default"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 transition-opacity"
              style={{ background: item.color, opacity: hovered === null || hovered === i ? 1 : 0.4 }}
            />
            <span
              className="text-sm flex-1 truncate transition-colors"
              style={{ color: hovered === i ? '#f5f5f5' : '#b0b0b0' }}
            >
              {item.label}
            </span>
            <span className="text-sm font-semibold text-text-primary tabular-nums">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function RatingHistogram({ data }: { data: { rating: number; count: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="text-text-muted text-sm text-center py-10">No ratings yet</p>;
  }

  const max = Math.max(...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);

  const buckets = Array.from({ length: 10 }, (_, i) => {
    const rating = i + 1;
    const found = data.find((d) => d.rating === rating);
    return { rating, count: found?.count ?? 0 };
  });

  return (
    <div>
      <div className="flex items-end gap-1.5 h-36">
        {buckets.map(({ rating, count }) => {
          const pct = max > 0 ? (count / max) * 100 : 0;
          const isHov = hovered === rating;
          return (
            <div
              key={rating}
              className="flex-1 flex flex-col items-center gap-1 cursor-default"
              onMouseEnter={() => setHovered(rating)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHov && count > 0 && (
                <span className="text-[10px] text-text-primary font-semibold">{count}</span>
              )}
              <div className="w-full flex items-end" style={{ height: '100px' }}>
                <div
                  className="w-full rounded-t-sm transition-all duration-150"
                  style={{
                    height: count > 0 ? `${Math.max(pct, 4)}%` : '2px',
                    background: count > 0
                      ? (isHov ? '#89CFF0' : 'rgb(137 207 240 / 55%)')
                      : 'rgb(255 255 255 / 8%)',
                  }}
                />
              </div>
              <span className="text-[10px] text-text-muted">{rating}</span>
            </div>
          );
        })}
      </div>
      <p className="text-text-muted text-xs mt-3 text-right">{total} rating{total !== 1 ? 's' : ''} total</p>
    </div>
  );
}

function PosterCard({
  title,
  posterPath,
  status,
  personalRating,
  timestamp,
}: {
  title: string;
  posterPath: string | null;
  status: string;
  personalRating: number | null;
  timestamp?: string;
}) {
  const poster = tmdbPoster(posterPath);
  return (
    <div className="shrink-0 w-32 h-48 relative rounded-xl overflow-hidden border border-accent-blue/15 shadow-lg cursor-default transition-all duration-200 hover:border-accent-blue/40 hover:scale-[1.03] hover:shadow-accent-blue/10 hover:shadow-xl">
      {poster ? (
        <img src={poster} alt={title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-bg-card flex items-center justify-center p-3">
          <span className="text-text-muted text-xs text-center leading-tight">{title}</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-white text-[11px] font-semibold leading-tight mb-2 line-clamp-2 drop-shadow">{title}</p>
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border backdrop-blur-sm ${STATUS_BADGE[status] ?? 'bg-black/40 text-white/70 border-white/20'}`}>
            {STATUS_LABELS[status] ?? status}
          </span>
          {personalRating != null && (
            <span className="text-[10px] font-bold text-accent-blue drop-shadow">{personalRating}/10</span>
          )}
        </div>
        {timestamp && (
          <p className="text-white/40 text-[9px] mt-1.5">{timeAgo(timestamp)}</p>
        )}
      </div>
    </div>
  );
}

type ChartTab = 'genres' | 'providers' | 'status' | 'ratings';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'pfp' | 'bg' | null>(null);
  const [chartTab, setChartTab] = useState<ChartTab>('genres');
  const pfpInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = () => {
    Promise.all([
      fetch('/api/profile', { credentials: 'include' }).then((r) => r.ok ? r.json() : Promise.reject()),
      fetch('/api/profile/charts', { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([profileData, chartsData]) => {
        setUser(profileData.user);
        setStats(profileData.stats);
        if (chartsData?.success) setCharts(chartsData);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener('focus', fetchProfile);
    return () => window.removeEventListener('focus', fetchProfile);
  }, []);

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
    } catch (e) {
      console.error('Failed to upload image:', e);
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
  const total = stats?.total ?? 0;

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
      {/* bg */}
      <div className="relative h-60 group/banner overflow-hidden">
        {user.background_image_url ? (
          <img src={user.background_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-blue/25 via-bg-dark/60 to-bg-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-bg-dark" />

        <button
          onClick={() => bgInputRef.current?.click()}
          disabled={saving === 'bg'}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 bg-black/60 backdrop-blur-sm text-white text-sm font-medium rounded-xl border border-white/20 hover:bg-black/70 transition-colors">
            {saving === 'bg' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-base">🖼</span>
            )}
            Change Background
          </div>
        </button>

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
        {/* avatar row */}
        <div className="flex items-end justify-between -mt-16 mb-10">
          <div className="flex items-end gap-5">
            <div className="relative group/avatar shrink-0">
              <div className="w-32 h-32 rounded-full border-4 border-bg-dark overflow-hidden bg-accent-blue/20 flex items-center justify-center text-5xl font-bold text-accent-blue shadow-xl">
                {user.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.username[0]?.toUpperCase()}</span>
                )}
              </div>
              <button
                onClick={() => pfpInputRef.current?.click()}
                disabled={saving === 'pfp'}
                className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
              >
                {saving === 'pfp' ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-white text-2xl">📷</span>
                )}
              </button>
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

        {/* library breakdown bar */}
        {total > 0 && (
          <div className="modern-panel rounded-2xl p-6 mb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-4">Library breakdown</p>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              {(stats!.watching > 0) && (
                <div className="bg-blue-400 rounded-l-full transition-all" style={{ width: `${(stats!.watching / total) * 100}%` }} />
              )}
              {(stats!.completed > 0) && (
                <div className="bg-green-400 transition-all" style={{ width: `${(stats!.completed / total) * 100}%` }} />
              )}
              {(stats!.planned > 0) && (
                <div className="bg-sky-300 rounded-r-full transition-all" style={{ width: `${(stats!.planned / total) * 100}%` }} />
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

        {/* stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
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

        {/* recent activity */}
        {charts && charts.activity.length > 0 && (
          <div className="mb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Recent activity</p>
            <div className="flex gap-3 overflow-x-auto pb-2" >
              {charts.activity.map((item, i) => (
                <PosterCard
                  key={i}
                  title={item.title}
                  posterPath={item.poster_path}
                  status={item.status}
                  personalRating={item.personal_rating}
                  timestamp={item.updated_at}
                />
              ))}
            </div>
          </div>
        )}

        {/* favorites */}
        {charts && charts.favorites.length > 0 && (
          <div className="mb-6">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Favorites</p>
            <div className="flex gap-3 overflow-x-auto pb-2" >
              {charts.favorites.map((item, i) => (
                <PosterCard
                  key={i}
                  title={item.title}
                  posterPath={item.poster_path}
                  status={item.status}
                  personalRating={item.personal_rating}
                />
              ))}
            </div>
          </div>
        )}

        {/* charts panel */}
        {charts && (
          <div className="modern-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-text-muted text-xs uppercase tracking-wider">Statistics</p>
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                {chartTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setChartTab(tab.key)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      chartTab === tab.key
                        ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                        : 'text-text-muted hover:text-text-primary'
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
