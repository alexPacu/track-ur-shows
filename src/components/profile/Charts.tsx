'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface StatsData {
  total: number;
  watching: number;
  completed: number;
  planned: number;
  movies: number;
  tv_shows: number;
  avg_personal_rating: number | null;
  total_minutes_watched: number;
}

export interface ActivityItem {
  tmdb_id: number;
  title: string;
  media_type: string;
  poster_path: string | null;
  status: string;
  personal_rating: number | null;
  updated_at: string;
}

export interface FavoriteItem {
  tmdb_id: number;
  title: string;
  media_type: string;
  poster_path: string | null;
  status: string;
  personal_rating: number | null;
}

export interface ChartsData {
  genres: { genreId: number; count: number }[];
  providers: { name: string; logoPath: string | null; count: number }[];
  activity: ActivityItem[];
  statuses: { status: string; count: number }[];
  favorites: FavoriteItem[];
  ratingDistribution: { rating: number; count: number }[];
  heatmap: { day: string; count: number }[];
}

export interface ChartItem { label: string; count: number; color: string }
export type ChartTab = 'genres' | 'providers' | 'status' | 'ratings';

export const TMDB_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};

export const STATUS_LABELS: Record<string, string> = {
  watching: 'Watching',
  completed: 'Completed',
  planning_to_watch: 'Planned',
};

export const STATUS_COLORS: Record<string, string> = {
  watching: '#60a5fa',
  completed: '#34d399',
  planning_to_watch: '#7dd3fc',
};

export const STATUS_BADGE: Record<string, string> = {
  watching: 'bg-blue-400/15 text-blue-300 border-blue-400/25',
  completed: 'bg-green-400/15 text-green-300 border-green-400/25',
  planning_to_watch: 'bg-sky-300/15 text-sky-300 border-sky-300/25',
};

export const CHART_COLORS = [
  '#89CFF0', '#60a5fa', '#34d399', '#a78bfa', '#f472b6',
  '#fb923c', '#facc15', '#f87171', '#2dd4bf', '#818cf8',
];

export function tmdbPoster(path: string | null): string | null {
  return path ? `https://image.tmdb.org/t/p/w185${path}` : null;
}

export function formatDuration(minutes: number): string {
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

function parseUtc(date: string) {
  return new Date(date.endsWith('Z') || date.includes('+') ? date : date + 'Z');
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - parseUtc(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

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

export function DonutChart({ items }: { items: ChartItem[] }) {
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

export function RatingHistogram({ data }: { data: { rating: number; count: number }[] }) {
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

export function PosterCard({
  title,
  posterPath,
  status,
  personalRating,
  timestamp,
  tmdbId,
  mediaType,
}: {
  title: string;
  posterPath: string | null;
  status: string;
  personalRating: number | null;
  timestamp?: string;
  tmdbId: number;
  mediaType: string;
}) {
  const poster = tmdbPoster(posterPath);
  const href = `/${mediaType === 'movie' ? 'movies' : 'shows'}/${tmdbId}`;
  return (
    <Link href={href} className="shrink-0 w-32 h-48 relative rounded-xl overflow-hidden border border-accent-blue/15 shadow-lg transition-all duration-200 hover:border-accent-blue/40 hover:scale-[1.03] hover:shadow-accent-blue/10 hover:shadow-xl">
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
    </Link>
  );
}

export function ActivityHeatmap({ data }: { data: { day: string; count: number }[] }) {
  const countMap = new Map(data.map((d) => [d.day, d.count]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() - today.getDay());

  const startSunday = new Date(thisSunday);
  startSunday.setDate(thisSunday.getDate() - 51 * 7);

  interface DayCell { date: Date; count: number; future: boolean }
  const weeks: DayCell[][] = [];
  const cur = new Date(startSunday);

  for (let w = 0; w < 52; w++) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(cur);
      const key = `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, '0')}-${String(cell.getDate()).padStart(2, '0')}`;
      week.push({ date: cell, count: countMap.get(key) ?? 0, future: cell > today });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(137,207,240,0.06)';
    if (count === 1) return 'rgba(137,207,240,0.28)';
    if (count === 2) return 'rgba(137,207,240,0.52)';
    if (count === 3) return 'rgba(137,207,240,0.75)';
    return 'rgba(137,207,240,0.95)';
  };

  const monthLabels: { weekIndex: number; label: string }[] = [];
  weeks.forEach((week, wi) => {
    const first = week[0].date;
    const prev = wi > 0 ? weeks[wi - 1][0].date : null;
    if (!prev || first.getMonth() !== prev.getMonth()) {
      monthLabels.push({
        weekIndex: wi,
        label: first.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
  });

  const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  const total = data.reduce((s, d) => s + d.count, 0);

  const CELL = 16;
  const GAP = 5;

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-3 min-w-max">
          <div className="flex flex-col pt-6 pr-1" style={{ gap: GAP }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-xs text-text-muted flex items-center justify-end w-8"
                style={{ height: CELL, lineHeight: `${CELL}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          <div>
            <div className="flex mb-2 h-5" style={{ gap: GAP }}>
              {weeks.map((_, wi) => {
                const label = monthLabels.find((m) => m.weekIndex === wi);
                return (
                  <div key={wi} className="relative" style={{ width: CELL }}>
                    {label && (
                      <span className="absolute text-xs text-text-muted whitespace-nowrap font-medium" style={{ left: 0 }}>
                        {label.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className="rounded-[3px] transition-all hover:scale-110 cursor-default"
                      style={{
                        width: CELL,
                        height: CELL,
                        background: day.future ? 'transparent' : getColor(day.count),
                      }}
                      title={day.future ? '' : `${day.date.toDateString()}: ${day.count} interaction${day.count !== 1 ? 's' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-text-muted text-sm">{total} interaction{total !== 1 ? 's' : ''} in the last year</p>
        <div className="flex items-center gap-2 text-text-muted text-xs">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-[3px]" style={{ width: CELL, height: CELL, background: getColor(n) }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
