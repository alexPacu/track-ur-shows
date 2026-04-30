import * as v from 'valibot';

export const PageSchema = v.pipe(
  v.optional(v.string(), '1'),
  v.transform((s) => parseInt(s, 10)),
  v.integer(),
  v.minValue(1, 'Page must be between 1 and 500'),
  v.maxValue(500, 'Page must be between 1 and 500')
);

export const MediaTypeQuerySchema = v.optional(
  v.picklist(['movie', 'tv'] as const, 'type must be "movie" or "tv"'),
  'movie' as const
);

export const IdPathSchema = v.pipe(
  v.string(),
  v.transform((s) => parseInt(s, 10)),
  v.integer(),
  v.minValue(1, 'Invalid ID')
);

export const SearchQuerySchema = v.object({
  query: v.pipe(
    v.string(),
    v.transform((s) => s.trim()),
    v.nonEmpty('Search query is required'),
    v.minLength(2, 'Search query must be at least 2 characters')
  ),
  page: PageSchema,
  type: MediaTypeQuerySchema,
});

export const PopularQuerySchema = v.object({
  page: PageSchema,
  type: MediaTypeQuerySchema,
});

export const TrendingQuerySchema = v.object({
  timeWindow: v.optional(
    v.picklist(['day', 'week'] as const, 'timeWindow must be "day" or "week"'),
    'day' as const
  ),
  type: MediaTypeQuerySchema,
});

export const DiscoverQuerySchema = v.object({
  type:                 MediaTypeQuerySchema,
  with_genres:          v.optional(v.string()),
  with_watch_providers: v.optional(v.string()),
  page:                 PageSchema,
});

export const TopRatedQuerySchema = v.object({
  type: MediaTypeQuerySchema,
});

export const SeasonPathSchema = v.object({
  id: IdPathSchema,
  seasonNumber: v.pipe(
    v.string(),
    v.transform((s) => parseInt(s, 10)),
    v.integer(),
    v.minValue(0, 'Invalid season number')
  ),
});
