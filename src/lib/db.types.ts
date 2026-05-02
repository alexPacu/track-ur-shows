import { ColumnType, Generated } from 'kysely';

type NullableDate = ColumnType<Date | null, Date | string | null | undefined, Date | string | null>;

interface UsersTable {
  id: Generated<number>;
  email: string;
  username: string;
  password_hash: string;
  profile_picture_url: string | null;
  background_image_url: string | null;
  bio: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

interface UserStatsTable {
  id: Generated<number>;
  user_id: number;
  total_shows_watched: Generated<number>;
  total_episodes_watched: Generated<number>;
  total_hours_watched: Generated<number>;
  average_rating: number | null;
  updated_at: Generated<Date>;
}

interface GenresTable {
  id: Generated<number>;
  name: string;
  created_at: Generated<Date>;
}

interface NetworksTable {
  id: Generated<number>;
  tmdb_network_id: number;
  name: string;
  logo_path: string | null;
  created_at: Generated<Date>;
}

interface WatchProvidersTable {
  id: Generated<number>;
  tmdb_provider_id: number;
  name: string;
  logo_path: string | null;
  provider_type: 'flatrate' | 'buy' | 'rent';
  created_at: Generated<Date>;
}

interface ShowsTable {
  id: Generated<number>;
  tmdb_id: number;
  title: string;
  description: string | null;
  media_type: 'movie' | 'tv';
  genres: ColumnType<number[] | null, string | null, string | null>;
  rating: number | null;
  release_date: NullableDate;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime: number | null;
  total_episodes: number | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

interface SeasonsTable {
  id: Generated<number>;
  show_id: number;
  season_number: number;
  air_date: NullableDate;
  episode_count: number | null;
  poster_path: string | null;
  created_at: Generated<Date>;
}

interface EpisodesTable {
  id: Generated<number>;
  season_id: number;
  show_id: number;
  episode_number: number;
  name: string;
  air_date: NullableDate;
  runtime: number | null;
  still_path: string | null;
  overview: string | null;
  vote_average: number | null;
  created_at: Generated<Date>;
}

interface ShowWatchProvidersTable {
  id: Generated<number>;
  show_id: number;
  provider_id: number;
  region: string;
  provider_type: 'flatrate' | 'buy' | 'rent';
  created_at: Generated<Date>;
}

interface UserLibraryTable {
  id: Generated<number>;
  user_id: number;
  show_id: number;
  status: 'watching' | 'completed' | 'dropped' | 'paused' | 'planning_to_watch';
  personal_rating: number | null;
  is_favorite: Generated<boolean>;
  current_season: number | null;
  current_episode: number | null;
  date_started: NullableDate;
  date_completed: NullableDate;
  hours_watched: Generated<number>;
  times_rewatched: Generated<number>;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

interface UserEpisodesTable {
  id: Generated<number>;
  user_id: number;
  episode_id: number;
  watched_date: ColumnType<Date, Date | string, Date | string>;
  personal_rating: number | null;
  created_at: Generated<Date>;
}

interface WatchProgressTable {
  id: Generated<number>;
  user_id: number;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  season: Generated<number>;
  episode: Generated<number>;
  progress_seconds: Generated<number>;
  duration_seconds: Generated<number>;
  progress_percent: Generated<number>;
  title: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  completed: Generated<boolean>;
  last_watched_at: Generated<Date>;
  created_at: Generated<Date>;
}

interface UserReviewsTable {
  id: Generated<number>;
  user_id: number;
  show_id: number;
  review_text: string;
  spoiler_flag: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

interface UserListsTable {
  id: Generated<number>;
  user_id: number;
  name: string;
  description: string | null;
  is_public: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

interface ListItemsTable {
  id: Generated<number>;
  list_id: number;
  show_id: number;
  position: number | null;
  added_at: Generated<Date>;
}

interface ChatConversationsTable {
  id: Generated<number>;
  user_id: number;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  is_active: Generated<boolean>;
}

interface ChatMessagesTable {
  id: Generated<number>;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: Generated<Date>;
}

interface UserPreferencesTable {
  id: Generated<number>;
  user_id: number;
  favorite_genres: ColumnType<unknown, string | null, string | null>;
  favorite_networks: ColumnType<unknown, string | null, string | null>;
  mood_preferences: ColumnType<unknown, string | null, string | null>;
  preferred_languages: ColumnType<unknown, string | null, string | null>;
  watch_time_preference: 'morning' | 'evening' | 'anytime' | null;
  min_rating_threshold: number | null;
  max_runtime_preference: number | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

interface AiRecommendationsTable {
  id: Generated<number>;
  user_id: number;
  conversation_id: number | null;
  recommended_show_id: number;
  recommendation_type: 'simple' | 'conversational' | 'discussion' | 'mood-based';
  user_feedback: 'liked' | 'disliked' | 'neutral' | null;
  created_at: Generated<Date>;
}

interface ActivityLogTable {
  id: Generated<number>;
  user_id: number;
  action: string;
  tmdb_id: number;
  created_at: Generated<Date>;
}

interface FollowsTable {
  follower_id: number;
  followed_id: number;
  created_at: Generated<Date>;
}

export interface Database {
  users: UsersTable;
  user_stats: UserStatsTable;
  genres: GenresTable;
  networks: NetworksTable;
  watch_providers: WatchProvidersTable;
  shows: ShowsTable;
  seasons: SeasonsTable;
  episodes: EpisodesTable;
  show_watch_providers: ShowWatchProvidersTable;
  user_library: UserLibraryTable;
  user_episodes: UserEpisodesTable;
  watch_progress: WatchProgressTable;
  user_reviews: UserReviewsTable;
  user_lists: UserListsTable;
  list_items: ListItemsTable;
  chat_conversations: ChatConversationsTable;
  chat_messages: ChatMessagesTable;
  user_preferences: UserPreferencesTable;
  ai_recommendations: AiRecommendationsTable;
  activity_log: ActivityLogTable;
  follows: FollowsTable;
}
