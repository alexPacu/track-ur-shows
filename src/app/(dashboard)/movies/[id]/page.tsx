'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { PlusIcon } from '@/components/Icons';

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_url: string | null;
  backdrop_url: string | null;
  vote_average: number;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
  videos: { id: string; key: string; name: string; site: string; type: string }[];
}

function buildProfileUrl(path: string | null) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w185${path}`;
}

export default function MovieDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/movies/${id}`);
        if (res.ok) {
          const json = await res.json();
          setMovie(json.data);
        }
      } catch (e) {
        console.error('Failed to load movie:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="h-[500px] bg-bg-card animate-pulse" />
        <div className="max-w-[1480px] mx-auto px-10 mt-10 space-y-6">
          <div className="h-8 w-64 bg-bg-card animate-pulse rounded" />
          <div className="h-4 w-full max-w-2xl bg-bg-card animate-pulse rounded" />
          <div className="h-4 w-full max-w-xl bg-bg-card animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted text-lg">Movie not found.</p>
      </div>
    );
  }

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const releaseFormatted = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const hours = Math.floor(movie.runtime / 60);
  const mins = movie.runtime % 60;
  const runtimeStr = movie.runtime ? `${hours}h ${mins}m` : null;
  const director = movie.credits?.crew?.find((c) => c.job === 'Director');
  const cast = movie.credits?.cast?.slice(0, 12) || [];
  const trailer = movie.videos?.find((v) => v.type === 'Trailer' && v.site === 'YouTube');

  return (
    <div className="pb-20">
      {/* Hero backdrop */}
      <section className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          {movie.backdrop_url ? (
            <Image src={movie.backdrop_url} alt={movie.title} fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full bg-bg-card" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent" />
        </div>

        <div className="relative h-full max-w-[1480px] mx-auto px-10 flex items-end pb-10">
          <div className="flex-shrink-0 w-[200px] h-[300px] rounded-xl overflow-hidden border border-accent-blue/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] mr-8 hidden md:block">
            {movie.poster_url ? (
              <Image src={movie.poster_url} alt={movie.title} width={200} height={300} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-bg-card flex items-center justify-center text-text-muted">No poster</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-black text-text-primary leading-tight mb-3">
              {movie.title}
              {year && <span className="text-text-muted font-normal text-3xl ml-3">({year})</span>}
            </h1>

            <div className="flex items-center gap-3 flex-wrap text-sm text-text-muted mb-5">
              {movie.vote_average > 0 && (
                <span key="rating" className="text-accent-blue font-bold flex items-center gap-1 text-base">
                  ★ {movie.vote_average.toFixed(1)}
                </span>
              )}
              {runtimeStr && (
                <span key="runtime" className="flex items-center gap-3">
                  <span className="opacity-40">|</span>
                  <span>{runtimeStr}</span>
                </span>
              )}
              {movie.release_date && (
                <span key="date" className="flex items-center gap-3">
                  <span className="opacity-40">|</span>
                  <span>{releaseFormatted}</span>
                </span>
              )}
              {director && (
                <span key="director" className="flex items-center gap-3">
                  <span className="opacity-40">|</span>
                  <span>Dir. {director.name}</span>
                </span>
              )}
            </div>

            {movie.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-6">
                {movie.genres.map((g) => (
                  <span key={g.id} className="px-3 py-1 rounded-full text-xs font-semibold border border-accent-blue/30 text-accent-blue bg-accent-blue/10">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button className="flex items-center gap-2.5 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-white/85 transition-colors text-sm">
                <span>▶</span> Play
              </button>
              <button className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-white/60 text-white hover:border-accent-blue hover:text-accent-blue transition-colors">
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1480px] mx-auto px-10 mt-10 space-y-14">
        {movie.overview && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 rounded-full bg-accent-blue" />
              <h2 className="text-2xl font-bold text-text-primary">Overview</h2>
            </div>
            <p className="text-text-muted leading-relaxed max-w-3xl text-base">{movie.overview}</p>
          </section>
        )}

        {trailer && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 rounded-full bg-accent-blue" />
              <h2 className="text-2xl font-bold text-text-primary">Trailer</h2>
            </div>
            <div className="aspect-video max-w-3xl rounded-xl overflow-hidden border border-accent-blue/20">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={trailer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </section>
        )}

        {cast.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 rounded-full bg-accent-blue" />
              <h2 className="text-2xl font-bold text-text-primary">Actors</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cast.map((actor) => (
                <div key={actor.id} className="flex items-center gap-4 p-3 rounded-xl bg-bg-card/60 border border-accent-blue/10 hover:border-accent-blue/30 transition-colors">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-bg-dark flex-shrink-0 border border-accent-blue/20">
                    {buildProfileUrl(actor.profile_path) ? (
                      <Image
                        src={buildProfileUrl(actor.profile_path)!}
                        alt={actor.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted text-lg font-bold">
                        {actor.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-text-primary font-semibold text-sm truncate">{actor.name}</p>
                    <p className="text-text-muted text-xs truncate">{actor.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
