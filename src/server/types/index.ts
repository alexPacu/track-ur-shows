// type definitions for API responses and data models

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserData {
  id: number;
  email: string;
  username: string;
  profile_picture_url?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ShowData {
  id: number;
  tmdb_id: number;
  title: string;
  description?: string;
  media_type: 'movie' | 'tv';
  rating?: number;
  release_date?: Date;
  poster_path?: string;
  backdrop_path?: string;
  runtime?: number;
}
