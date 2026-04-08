'use client';

import Link from 'next/link';
import Image from 'next/image';
import { StarIcon } from './Icons';

interface MediaCardProps {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  posterUrl?: string;
  rating?: number;
  genres?: string[];
  episodeCount?: number;
  isAiring?: boolean;
}

export function MediaCard({
  id,
  type,
  title,
  posterUrl,
  rating,
  genres = [],
  episodeCount,
  isAiring = false,
}: MediaCardProps) {
  const href = `/dashboard/${type === 'tv' ? 'shows' : 'movies'}/${id}`;

  return (
    <Link href={href}>
      <div className="group relative overflow-hidden rounded-xl border border-accent-blue/20 bg-bg-card/75 shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-accent-blue/50 hover:shadow-[0_8px_20px_rgba(137,207,240,0.2)]">
        <div className="relative w-full aspect-video bg-bg-card">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              className="object-cover transition group-hover:opacity-75"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-card to-bg-dark">
              <span className="text-text-muted">No image</span>
            </div>
          )}

          {isAiring && (
            <div className="absolute top-3 right-3 bg-accent-blue text-bg-dark px-2 py-1 rounded text-xs font-bold">
              AIRING
            </div>
          )}

          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-bg-dark via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <button className="w-full bg-accent-blue py-3 font-semibold text-bg-dark hover:bg-blue-300">
              {type === 'tv' ? 'Watch Show' : 'Watch Now'}
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="mb-2 truncate font-semibold text-text-primary transition hover:text-accent-blue">
            {title}
          </h3>

          {rating && (
            <div className="flex items-center gap-1 mb-2">
              <StarIcon className="w-4 h-4 text-accent-blue" />
              <span className="text-text-primary text-sm font-medium">{rating.toFixed(1)}</span>
            </div>
          )}

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {genres.slice(0, 2).map((genre, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-accent-blue/10 text-accent-blue px-2 py-1 rounded"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {episodeCount && (
            <p className="text-text-muted text-xs">{episodeCount} episodes</p>
          )}
        </div>
      </div>
    </Link>
  );
}
