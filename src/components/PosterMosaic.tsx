'use client';

import { useEffect, useState } from 'react';

type Item = {
  title: string;
  backdrop_url: string;
  media_type: string;
  vote_average: number;
};

let cache: Item[] | null = null;

function toItem(raw: any, type: 'movie' | 'tv'): Item | null {
  const url = raw?.poster_url?.replace('/w342/', '/w500/');
  if (!url) return null;
  return {
    title: type === 'movie' ? raw.title : raw.name,
    backdrop_url: url,
    media_type: type,
    vote_average: raw.vote_average ?? 0,
  };
}

async function fetchAll(): Promise<Item[]> {
  const endpoints = [
    ['/api/movies/trending?type=movie', 'movie'],
    ['/api/movies/trending?type=tv',    'tv'],
    ['/api/movies/popular?type=movie',  'movie'],
    ['/api/movies/popular?type=tv',     'tv'],
    ['/api/movies/top-rated?type=movie','movie'],
    ['/api/movies/top-rated?type=tv',   'tv'],
  ] as const;

  const responses = await Promise.all(
    endpoints.map(([url]) => fetch(url).then(r => r.json()).catch(() => null))
  );

  const seen = new Set<string>();
  const items: Item[] = [];

  for (let take = 0; take < 3; take++) {
    for (let s = 0; s < responses.length && items.length < 12; s++) {
      const results: any[] = responses[s]?.data?.results ?? [];
      const type = endpoints[s][1];
      const raw = results[take];
      const item = raw ? toItem(raw, type) : null;
      if (item && !seen.has(item.title)) {
        seen.add(item.title);
        items.push(item);
      }
    }
  }

  return items;
}

export default function PosterMosaic() {
  const [items, setItems] = useState<Item[]>(cache ?? []);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (cache) return;
    fetchAll().then(results => {
      cache = results;
      setItems(results);
    });
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setCurrentIndex(i => (i + 1) % items.length), 5000);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {items.length === 0 && (
        <div className="absolute inset-0 bg-bg-card animate-pulse" />
      )}

      {items.map((item, i) => (
        <div
          key={item.backdrop_url}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out bg-bg-dark"
          style={{ opacity: i === currentIndex ? 1 : 0 }}
        >
          <img
            src={item.backdrop_url}
            alt={item.title}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      ))}

      <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgb(12,14,20) 0%, transparent 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgb(12,14,20) 0%, rgba(12,14,20,0.5) 55%, transparent 100%)' }} />
      <div className="absolute inset-y-0 left-0 w-24 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgb(12,14,20), transparent)' }} />
      <div className="absolute inset-y-0 right-0 w-32 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgb(17,21,32), transparent)' }} />

      {items.map((item, i) => (
        <div
          key={`info-${item.backdrop_url}`}
          className="absolute bottom-0 right-0 px-6 pb-8 text-right transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: i === currentIndex ? 1 : 0 }}
        >
          <div className="flex gap-2 mb-3 justify-end">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1 rounded bg-black/40 backdrop-blur-sm border border-white/10 text-text-muted">
              {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
            </span>
            {item.vote_average > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1 rounded bg-black/40 backdrop-blur-sm border border-accent-blue/20 text-accent-blue">
                ★ {item.vote_average.toFixed(1)}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-text-primary leading-tight">
            {item.title}
          </h2>
        </div>
      ))}

      {items.length > 0 && (
        <div className="absolute right-5 bottom-1/2 translate-y-1/2 flex flex-col gap-1.5">
          {items.map((_, i) => (
            <div
              key={i}
              className="w-0.5 rounded-full transition-all duration-500"
              style={{
                height: i === currentIndex ? '22px' : '6px',
                background: i === currentIndex ? 'rgb(137 207 240)' : 'rgba(137,207,240,0.22)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
