import * as v from 'valibot';
import { MediaTypeSchema } from './watchlist.validator';

export const WatchProgressPostSchema = v.object({
  tmdbId: v.pipe(
    v.unknown(),
    v.transform(Number),
    v.integer('tmdbId must be a positive integer'),
    v.minValue(1, 'tmdbId must be a positive integer')
  ),
  mediaType:       MediaTypeSchema,
  season:          v.optional(v.pipe(v.unknown(), v.transform(Number), v.integer())),
  episode:         v.optional(v.pipe(v.unknown(), v.transform(Number), v.integer())),
  progressSeconds: v.optional(v.pipe(v.unknown(), v.transform(Number))),
  durationSeconds: v.optional(v.pipe(v.unknown(), v.transform(Number))),
  progressPercent: v.optional(v.number()),
  title:           v.optional(v.string()),
  posterPath:      v.optional(v.string()),
  backdropPath:    v.optional(v.string()),
  completed:       v.optional(v.boolean()),
});
export type WatchProgressPostInput = v.InferOutput<typeof WatchProgressPostSchema>;

export const WatchProgressDeleteSchema = v.object({
  tmdbId: v.pipe(
    v.string(),
    v.transform((s) => parseInt(s, 10)),
    v.integer('tmdbId must be a positive integer'),
    v.minValue(1, 'tmdbId must be a positive integer')
  ),
  mediaType: MediaTypeSchema,
  season: v.pipe(
    v.optional(v.string(), '0'),
    v.transform((s) => parseInt(s, 10)),
    v.integer()
  ),
  episode: v.pipe(
    v.optional(v.string(), '0'),
    v.transform((s) => parseInt(s, 10)),
    v.integer()
  ),
});
export type WatchProgressDeleteInput = v.InferOutput<typeof WatchProgressDeleteSchema>;
