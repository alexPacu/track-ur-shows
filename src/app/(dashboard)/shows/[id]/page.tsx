'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { PlusIcon } from '@/components/Icons';

interface ShowDetails {
  id: number;
  name: string;
  overview: string;
  poster_url: string | null;
  backdrop_url: string | null;
  vote_average: number;
  first_air_date: string;
  last_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { id: number; name: string }[];
  seasons: { id: number; season_number: number; name: string; episode_count: number; air_date: string }[];
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
  created_by: { id: number; name: string }[];
}

interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_url: string | null;
  air_date: string;
  runtime: number;
  vote_average: number;
}

function buildProfileUrl(path: string | null) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w185${path}`;
}

export default function ShowDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [show, setShow] = useState<ShowDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodeCache, setEpisodeCache] = useState<Record<number, Episode[]>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/shows/${id}`);
        if (res.ok) {
          const json = await res.json();
          setShow(json.data);
          const realSeasons = (json.data.seasons || []).filter((s: any) => s.season_number > 0);
          if (realSeasons.length > 0) {
            setSelectedSeason(realSeasons[0].season_number);
          }
        }
      } catch (e) {
        console.error('Failed to load show:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const fetchEpisodes = useCallback(async (seasonNum: number) => {
    if (episodeCache[seasonNum]) {
      setEpisodes(episodeCache[seasonNum]);
      return;
    }
    setEpisodesLoading(true);
    try {
      const res = await fetch(`/api/shows/${id}/season/${seasonNum}`);
      if (res.ok) {
        const json = await res.json();
        const eps = json.data?.episodes ?? [];
        setEpisodes(eps);
        setEpisodeCache((prev) => ({ ...prev, [seasonNum]: eps }));
      }
    } catch (e) {
      console.error('Failed to load episodes:', e);
    } finally {
      setEpisodesLoading(false);
    }
  }, [id, episodeCache]);

  useEffect(() => {
    if (show && selectedSeason > 0) {
      fetchEpisodes(selectedSeason);
    }
  }, [show, selectedSeason]); 

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="h-[500px] bg-bg-card animate-pulse" />
        <div className="max-w-[1480px] mx-auto px-10 mt-10 space-y-6">
          <div className="h-8 w-64 bg-bg-card animate-pulse rounded" />
          <div className="h-4 w-full max-w-2xl bg-bg-card animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted text-lg">Show not found.</p>
      </div>
    );
  }

  const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : null;
  const endYear = show.last_air_date ? new Date(show.last_air_date).getFullYear() : null;
  const yearRange = year ? (endYear && endYear !== year ? `${year}–${endYear}` : `${year}`) : null;
  const cast = show.credits?.cast?.slice(0, 12) || [];
  const realSeasons = show.seasons?.filter((s) => s.season_number > 0) || [];
  const creator = show.created_by?.[0];

  return (
    <div className="pb-20">
      <section className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          {show.backdrop_url ? (
            <Image src={show.backdrop_url} alt={show.name} fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full bg-bg-card" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent" />
        </div>

        <div className="relative h-full max-w-[1480px] mx-auto px-10 flex items-end pb-10">
          <div className="flex-shrink-0 w-[200px] h-[300px] rounded-xl overflow-hidden border border-accent-blue/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] mr-8 hidden md:block">
            {show.poster_url ? (
              <Image src={show.poster_url} alt={show.name} width={200} height={300} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-bg-card flex items-center justify-center text-text-muted">No poster</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-black text-text-primary leading-tight mb-3">
              {show.name}
              {yearRange && <span className="text-text-muted font-normal text-3xl ml-3">({yearRange})</span>}
            </h1>

            <div className="flex items-center gap-3 flex-wrap text-sm text-text-muted mb-5">
              {show.vote_average > 0 && (
                <span className="text-accent-blue font-bold flex items-center gap-1 text-base">
                  ★ {show.vote_average.toFixed(1)}
                </span>
              )}
              <span className="opacity-40">|</span>
              <span>{show.number_of_seasons} Season{show.number_of_seasons !== 1 ? 's' : ''}</span>
              <span className="opacity-40">|</span>
              <span>{show.number_of_episodes} Episodes</span>
              {creator && (
                <>
                  <span className="opacity-40">|</span>
                  <span>Created by {creator.name}</span>
                </>
              )}
            </div>

            {show.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-6">
                {show.genres.map((g) => (
                  <span key={g.id} className="px-3 py-1 rounded-full text-xs font-semibold border border-accent-blue/30 text-accent-blue bg-accent-blue/10">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-white/60 text-white hover:border-accent-blue hover:text-accent-blue transition-colors">
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1480px] mx-auto px-10 mt-10 space-y-14">
        {show.overview && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 rounded-full bg-accent-blue" />
              <h2 className="text-2xl font-bold text-text-primary">Overview</h2>
            </div>
            <p className="text-text-muted leading-relaxed max-w-3xl text-base">{show.overview}</p>
          </section>
        )}

        {realSeasons.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full bg-accent-blue" />
                <h2 className="text-2xl font-bold text-text-primary">Episodes</h2>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                  className="rounded-lg border border-accent-blue/30 bg-bg-card px-4 py-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
                >
                  {realSeasons.map((s) => (
                    <option key={s.season_number} value={s.season_number}>
                      Season {s.season_number}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {episodesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 bg-bg-card animate-pulse rounded-xl" />
                ))}
              </div>
            ) : episodes.length > 0 ? (
              <div className="space-y-3">
                {episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex gap-4 p-4 rounded-xl bg-bg-card/60 border border-accent-blue/10 hover:border-accent-blue/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-[185px] h-[104px] rounded-lg overflow-hidden bg-bg-dark relative">
                      {ep.still_url ? (
                        <Image src={ep.still_url} alt={ep.name} fill className="object-cover" sizes="185px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                          Ep {ep.episode_number}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-black text-lg">
                          ▶
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-accent-blue font-bold text-sm">E{ep.episode_number}</span>
                        <h3 className="text-text-primary font-semibold text-sm truncate group-hover:text-accent-blue transition-colors">
                          {ep.name}
                        </h3>
                        {ep.vote_average > 0 && (
                          <span className="text-accent-blue text-xs ml-auto flex-shrink-0">★ {ep.vote_average.toFixed(1)}</span>
                        )}
                      </div>
                      {ep.overview && (
                        <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{ep.overview}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-text-muted text-xs">
                        {ep.air_date && <span>{ep.air_date}</span>}
                        {ep.runtime > 0 && (
                          <>
                            <span className="opacity-40">|</span>
                            <span>{ep.runtime}m</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted">No episodes available for this season.</p>
            )}
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
