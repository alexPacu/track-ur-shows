'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { PlusIcon, CheckCircleIcon } from '@/components/Icons';

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_url: string | null;
  backdrop_url: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
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
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [savedProgress, setSavedProgress] = useState<{ seconds: number } | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistExpanded, setWatchlistExpanded] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);

  // latest progress snapshot used when closing the player
  const latestProgress = useRef({ seconds: 0, duration: 0, percent: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [movieRes, progressRes, watchlistRes] = await Promise.all([
          fetch(`/api/movies/${id}`),
          fetch('/api/watch-progress', { credentials: 'include' }),
          fetch(`/api/watchlist?tmdbId=${id}`, { credentials: 'include' }),
        ]);
        if (movieRes.ok) {
          const json = await movieRes.json();
          setMovie(json.data);
        }
        if (progressRes.ok) {
          const { data } = await progressRes.json();
          const entry = (data ?? []).find(
            (p: any) => Number(p.tmdb_id) === Number(id) && p.media_type === 'movie'
          );
          if (entry && Number(entry.progress_seconds) > 0) {
            setSavedProgress({ seconds: Number(entry.progress_seconds) });
          }
        }
        if (watchlistRes.ok) {
          const wlData = await watchlistRes.json();
          setInWatchlist(wlData.inWatchlist ?? false);
          setWatchlistStatus(wlData.status ?? null);
        }
      } catch (e) {
        console.error('Failed to load movie:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!movie) return;
    const resume = searchParams.get('resume');
    if (resume === '1') {
      const prog = Number(searchParams.get('progress') ?? 0);
      setResumeSeconds(Number.isFinite(prog) ? prog : 0);
      setPlayerOpen(true);
    }
  }, [movie, searchParams]);

  const saveProgress = async (opts: {
    seconds: number;
    duration: number;
    percent: number;
    completed?: boolean;
  }) => {
    if (!movie) return;
    try {
      await fetch('/api/watch-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tmdbId: Number(id),
          mediaType: 'movie',
          progressSeconds: opts.seconds,
          durationSeconds: opts.duration,
          progressPercent: opts.percent,
          title: movie.title,
          posterPath: movie.poster_path,
          backdropPath: movie.backdrop_path,
          completed: opts.completed ?? false,
        }),
      });
    } catch (e) {
      console.error('Failed to save watch progress:', e);
    }
  };

  // event-driven progress tracking: advance only when Vidking reports playback
  useEffect(() => {
    if (!playerOpen || !movie) return;

    const fallbackDuration = (movie.runtime ?? 0) * 60;

    const initialSeconds = (() => {
      const raw = Math.max(0, Math.floor(resumeSeconds));
      const rewound = Math.max(0, raw - 10);
      if (fallbackDuration > 0) return Math.min(rewound, Math.max(0, fallbackDuration - 5));
      return rewound;
    })();

    latestProgress.current = {
      seconds: initialSeconds,
      duration: fallbackDuration,
      percent: fallbackDuration > 0 ? (initialSeconds / fallbackDuration) * 100 : 0,
    };

    saveProgress({
      seconds: latestProgress.current.seconds,
      duration: latestProgress.current.duration,
      percent: latestProgress.current.percent,
    });

    // while playing, persist the current state every 5s as a safety net for
    // cases where the user closes the tab
    let isPlaying = false;
    const saveInterval = setInterval(() => {
      if (!isPlaying) return;
      saveProgress({
        seconds: latestProgress.current.seconds,
        duration: latestProgress.current.duration,
        percent: latestProgress.current.percent,
      });
    }, 5000);

    const handler = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const msg = JSON.parse(event.data);
        if (msg?.type !== 'PLAYER_EVENT') return;
        const { event: evt, currentTime, duration, progress } = msg.data ?? {};
        if (typeof currentTime === 'number') {
          const dur = Math.floor(duration ?? latestProgress.current.duration ?? fallbackDuration);
          const clamped = dur > 0 ? Math.min(currentTime, dur) : currentTime;
          const pct = typeof progress === 'number' && progress > 0
            ? progress
            : dur > 0 ? (clamped / dur) * 100 : 0;
          latestProgress.current = {
            seconds: Math.floor(clamped),
            duration: dur,
            percent: Math.min(100, pct),
          };
        }
        if (evt === 'play' || evt === 'timeupdate') isPlaying = true;
        if (evt === 'pause' || evt === 'ended') isPlaying = false;
        if (evt === 'pause' || evt === 'ended' || evt === 'seeked') {
          saveProgress({
            seconds: latestProgress.current.seconds,
            duration: latestProgress.current.duration,
            percent: latestProgress.current.percent,
            completed: evt === 'ended',
          });
        }
      } catch {
        // ignore non-json messages
      }
    };
    window.addEventListener('message', handler);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('message', handler);
    };
  }, [playerOpen, movie, resumeSeconds]);

  const handleWatchlistStatus = async (status: string) => {
    if (watchlistLoading || !movie) return;
    setWatchlistLoading(true);
    setWatchlistError(null);
    try {
      if (inWatchlist) {
        const res = await fetch('/api/watchlist', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ tmdbId: Number(id), status }),
        });
        if (res.ok) { setWatchlistStatus(status); setWatchlistExpanded(false); }
        else { setWatchlistError('Failed to update status'); }
      } else {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tmdbId: Number(id),
            mediaType: 'movie',
            title: movie.title,
            description: movie.overview,
            posterPath: movie.poster_path,
            backdropPath: movie.backdrop_path,
            rating: movie.vote_average,
            releaseDate: movie.release_date,
            runtime: movie.runtime,
            genres: movie.genres.map((g) => g.id),
            status,
          }),
        });
        if (res.ok) { setInWatchlist(true); setWatchlistStatus(status); setWatchlistExpanded(false); }
        else { setWatchlistError('Failed to add to watchlist'); }
      }
    } catch {
      setWatchlistError('Network error');
    } finally {
      setWatchlistLoading(false);
    }
  };

  const removeFromWatchlist = async () => {
    if (watchlistLoading) return;
    setWatchlistLoading(true);
    setWatchlistError(null);
    try {
      const res = await fetch(`/api/watchlist?tmdbId=${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { setInWatchlist(false); setWatchlistStatus(null); setWatchlistExpanded(false); }
      else { setWatchlistError('Failed to remove'); }
    } catch {
      setWatchlistError('Network error');
    } finally {
      setWatchlistLoading(false);
    }
  };

  const closePlayer = () => {
    // always flush latest progress on close, even for short sessions
    saveProgress({
      seconds: latestProgress.current.seconds,
      duration: latestProgress.current.duration,
      percent: latestProgress.current.percent,
    });
    setPlayerOpen(false);
    setResumeSeconds(0);
  };

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

  // Vidking resume: use seconds. A tiny rewind + clamping improves reliability.
  const movieDurationSeconds = (movie.runtime ?? 0) * 60;
  const safeStartSeconds = (() => {
    const raw = Math.max(0, Math.floor(resumeSeconds));
    const rewound = Math.max(0, raw - 10);
    if (movieDurationSeconds > 0) return Math.min(rewound, Math.max(0, movieDurationSeconds - 5));
    return rewound;
  })();

  // Try `start` (common seek param) instead of `progress`.
  const embedSrc =
    `https://www.vidking.net/embed/movie/${id}` +
    (safeStartSeconds > 0
      ? `?autoPlay=true&start=${safeStartSeconds}`
      : '?autoPlay=true');

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

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  const raw = savedProgress?.seconds ?? 0;
                  const dur = (movie.runtime ?? 0) * 60;
                  const clamped = Math.max(0, Math.floor(raw));
                  setResumeSeconds(dur > 0 ? Math.min(clamped, Math.max(0, dur - 5)) : clamped);
                  setPlayerOpen(true);
                }}
                className="flex items-center gap-2.5 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-white/85 transition-colors text-sm"
              >
                <span>▶</span> {savedProgress ? 'Continue Watching' : 'Play'}
              </button>

              {watchlistExpanded ? (
                <div className="flex items-center gap-2">
                  {(['planning_to_watch', 'watching', 'completed'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleWatchlistStatus(s)}
                      disabled={watchlistLoading}
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold border-2 transition-colors disabled:opacity-50 ${
                        watchlistStatus === s
                          ? 'border-accent-blue bg-accent-blue text-white'
                          : 'border-white/40 text-white hover:border-accent-blue hover:text-accent-blue'
                      }`}
                    >
                      {{ planning_to_watch: 'Planned', watching: 'Watching', completed: 'Completed' }[s]}
                    </button>
                  ))}
                  {inWatchlist && (
                    <button
                      onClick={removeFromWatchlist}
                      disabled={watchlistLoading}
                      className="px-4 py-2.5 rounded-full text-sm font-semibold border-2 border-red-500/50 text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    onClick={() => setWatchlistExpanded(false)}
                    className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setWatchlistExpanded(true)}
                  disabled={watchlistLoading}
                  title={inWatchlist ? 'Change status' : 'Add to watchlist'}
                  className={`flex items-center justify-center w-11 h-11 rounded-full border-2 transition-colors disabled:opacity-50 ${
                    inWatchlist
                      ? 'border-accent-blue bg-accent-blue/20 text-accent-blue'
                      : 'border-white/60 text-white hover:border-accent-blue hover:text-accent-blue'
                  }`}
                >
                  {inWatchlist ? <CheckCircleIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                </button>
              )}
            </div>
            {watchlistError && (
              <p className="text-red-400 text-xs mt-2">{watchlistError}</p>
            )}
          </div>
        </div>
      </section>

      {/* fullscreen player overlay */}
      {playerOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={closePlayer}
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-xl"
          >
            ✕
          </button>
          <iframe
            src={embedSrc}
            width="100%"
            height="100%"
            allowFullScreen
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            className="w-full h-full border-0"
          />
        </div>
      )}

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
