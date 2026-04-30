import * as v from 'valibot';

const TMDBVideoSchema = v.object({
  id: v.string(),
  key: v.string(),
  name: v.string(),
  site: v.string(),
  type: v.string(),
});

const TMDBCastMemberSchema = v.object({
  id: v.number(),
  name: v.string(),
  character: v.string(),
  profile_path: v.nullable(v.string()),
});

const TMDBCrewMemberSchema = v.object({
  id: v.number(),
  name: v.string(),
  job: v.string(),
});

const TMDBImageItemSchema = v.object({
  file_path: v.string(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
});

const TMDBListItemSchema = v.object({
  id: v.number(),
  title: v.optional(v.string()),
  name: v.optional(v.string()),
  overview: v.optional(v.string()),
  poster_path: v.nullable(v.string()),
  backdrop_path: v.nullable(v.string()),
  vote_average: v.optional(v.number()),
  release_date: v.optional(v.string()),
  first_air_date: v.optional(v.string()),
});

export const TMDBListResponseSchema = v.object({
  page: v.number(),
  results: v.array(TMDBListItemSchema),
  total_pages: v.number(),
  total_results: v.number(),
});

const TMDBGenreSchema = v.object({
  id: v.number(),
  name: v.string(),
});

export const TMDBMovieDetailsSchema = v.object({
  id: v.number(),
  title: v.string(),
  overview: v.optional(v.string()),
  poster_path: v.nullable(v.string()),
  backdrop_path: v.nullable(v.string()),
  genres: v.optional(v.array(TMDBGenreSchema)),
  runtime: v.optional(v.nullable(v.number())),
  release_date: v.optional(v.nullable(v.string())),
  vote_average: v.optional(v.number()),
  videos: v.optional(v.object({ results: v.array(TMDBVideoSchema) })),
  credits: v.optional(v.object({
    cast: v.array(TMDBCastMemberSchema),
    crew: v.array(TMDBCrewMemberSchema),
  })),
  images: v.optional(v.object({
    backdrops: v.array(TMDBImageItemSchema),
    posters: v.array(TMDBImageItemSchema),
  })),
});

export const TMDBShowDetailsSchema = v.object({
  id: v.number(),
  name: v.string(),
  overview: v.optional(v.string()),
  poster_path: v.nullable(v.string()),
  backdrop_path: v.nullable(v.string()),
  genres: v.optional(v.array(TMDBGenreSchema)),
  first_air_date: v.optional(v.nullable(v.string())),
  vote_average: v.optional(v.number()),
  number_of_seasons: v.optional(v.nullable(v.number())),
  number_of_episodes: v.optional(v.nullable(v.number())),
  seasons: v.optional(v.array(v.object({
    id: v.number(),
    season_number: v.number(),
    episode_count: v.optional(v.number()),
    name: v.optional(v.string()),
    poster_path: v.optional(v.nullable(v.string())),
  }))),
  videos: v.optional(v.object({ results: v.array(TMDBVideoSchema) })),
  credits: v.optional(v.object({
    cast: v.array(TMDBCastMemberSchema),
    crew: v.array(TMDBCrewMemberSchema),
  })),
  images: v.optional(v.object({
    backdrops: v.array(TMDBImageItemSchema),
    posters: v.array(TMDBImageItemSchema),
  })),
});

export const TMDBSeasonDetailsSchema = v.object({
  id: v.number(),
  season_number: v.number(),
  episodes: v.optional(v.array(
    v.object({
      id: v.number(),
      name: v.string(),
      episode_number: v.number(),
      still_path: v.nullable(v.string()),
      runtime: v.optional(v.nullable(v.number())),
      overview: v.optional(v.string()),
      air_date: v.optional(v.nullable(v.string())),
    })
  )),
});
