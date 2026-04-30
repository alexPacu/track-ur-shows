import * as v from 'valibot';

export const MediaTypeSchema = v.picklist(
  ['movie', 'tv'] as const,
  'mediaType must be "movie" or "tv"'
);
export type MediaType = v.InferOutput<typeof MediaTypeSchema>;

export const WatchlistStatusSchema = v.picklist(
  ['watching', 'completed', 'planning_to_watch'] as const,
  'Status must be one of: watching, completed, planning_to_watch'
);
export type WatchlistStatus = v.InferOutput<typeof WatchlistStatusSchema>;

const TmdbIdSchema = v.pipe(
  v.unknown(),
  v.transform(Number),
  v.integer('tmdbId must be a positive integer'),
  v.minValue(1, 'tmdbId must be a positive integer')
);

export const WatchlistPostSchema = v.object({
  tmdbId:       TmdbIdSchema,
  mediaType:    MediaTypeSchema,
  title:        v.pipe(v.string(), v.nonEmpty('title is required')),
  posterPath:   v.optional(v.string()),
  backdropPath: v.optional(v.string()),
  rating:       v.optional(v.number()),
  releaseDate:  v.optional(v.string()),
  runtime:      v.optional(v.number()),
  genres:       v.optional(v.array(v.number())),
  description:  v.optional(v.string()),
  status:       v.optional(WatchlistStatusSchema, 'planning_to_watch'),
});
export type WatchlistPostInput = v.InferOutput<typeof WatchlistPostSchema>;

export const WatchlistPutSchema = v.pipe(
  v.object({
    tmdbId:          TmdbIdSchema,
    status:          v.optional(WatchlistStatusSchema),
    rating:          v.optional(v.nullable(v.pipe(v.number(), v.minValue(0, 'Rating must be between 0 and 10'), v.maxValue(10, 'Rating must be between 0 and 10')))),
    current_season:  v.optional(v.pipe(v.number(), v.integer('current_season must be a positive integer'), v.minValue(1, 'current_season must be a positive integer'))),
    current_episode: v.optional(v.pipe(v.number(), v.integer('current_episode must be a positive integer'), v.minValue(1, 'current_episode must be a positive integer'))),
    is_favorite:     v.optional(v.boolean()),
  }),
  v.check(
    (input) =>
      input.status !== undefined ||
      input.rating !== undefined ||
      input.current_season !== undefined ||
      input.current_episode !== undefined ||
      input.is_favorite !== undefined,
    'At least one of status, rating, progress, or is_favorite is required'
  )
);
export type WatchlistPutInput = v.InferOutput<typeof WatchlistPutSchema>;
