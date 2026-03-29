-- test data for development

INSERT INTO genres (name) VALUES
  ('Action'),
  ('Drama'),
  ('Comedy'),
  ('Horror'),
  ('Sci-Fi'),
  ('Romance'),
  ('Thriller'),
  ('Crime'),
  ('Animation'),
  ('Adventure');

INSERT INTO networks (tmdb_network_id, name, logo_path) VALUES
  (213, 'Netflix', '/o60Dn7gf0EvMEmjB3FeIvkAv.png'),
  (49, 'HBO', '/tuomPhY2UtuPTqqwmf59json_3f.png'),
  (1399, 'HBO (streaming)', '/tuomPhY2UtuPTqqwmf59json_3f.png'),
  (8, 'American Broadcast Company', '/kJhlsSMDdVrKqd1u4v7j9z3M9YW.png');

INSERT INTO watch_providers (tmdb_provider_id, name, logo_path, provider_type) VALUES
  (8, 'Netflix', '/wwemzKWzjKYJFfCeiB57q3r4Bcm.png', 'flatrate'),
  (9, 'Amazon Prime Video', '/emjicEg6oi75NV9LewKdVJ3irIP.png', 'flatrate'),
  (3, 'Google Play', '/wy6WcsN8cVAkPiR5aYG8c9Br5Sh.png', 'buy'),
  (2, 'Apple TV', '/q6nNQ5psJyREsFCFBDAl0LRdC5w.png', 'buy');

INSERT INTO users (email, username, password_hash, bio) VALUES
  ('test@test.com', 'testuser', '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYxhTBF6xB9KjB5N0fE.E68yT0pE3kfu', 'Test user for development');

INSERT INTO user_stats (user_id) VALUES
  (1);

INSERT INTO shows (tmdb_id, title, description, media_type, genres, rating, release_date, poster_path, backdrop_path, runtime) VALUES
  (1396, 'Breaking Bad', 'A chemistry teacher turns to manufacturing methamphetamine with a former student.', 'tv', '[8, 7]', 9.5, '2008-01-20', '/xvx4Axcow5Co6Mn4v9bA5kFry9y.jpg', '/zLhEOicDj9WdoKL8XK07IQVvgqS.jpg', NULL),
  (27205, 'Inception', 'A skilled thief is offered a chance at redemption with one last job: inception.', 'movie', '[5, 7]', 8.8, '2010-07-16', '/9gk7adHYeDMNNGvICktP7estP5.jpg', '/s3TBrRGB1iC1fgsrSmla8AWoeJ.jpg', 148),
  (1399, 'Game of Thrones', 'Nine noble families fight for control over the lands of Westeros.', 'tv', '[2, 6, 7]', 9.2, '2011-04-17', '/gwPSoagxli81O8+OGblang3Deca.jpg', '/gX8d86vt83nchxEKWM9yZaC56H.jpg', NULL),
  (19995, 'Avatar', 'A paraplegic man joins an alien planet mission and falls in love with a native.', 'movie', '[1, 5]', 7.8, '2009-12-18', '/8DpGmwDzHrPOIEqw2nni6list.jpg', '/rj03TC9xrljjV77SS16dqesNCQ.jpg', 162),
  (60573, 'Peaky Blinders', 'A gangster family epic set in 1900s Birmingham, England.', 'tv', '[2, 7, 8]', 8.8, '2013-09-12', '/rN7RjgEMgkxInj1qQ4dUMyj3rzn.jpg', '/qXKB1c3hhzkAkKRcJpQS2xxWJ7r.jpg', NULL);

INSERT INTO seasons (show_id, season_number, air_date, episode_count, poster_path) VALUES
  (1, 1, '2008-01-20', 7, '/rrjx1p9z46cgNuMA89d4lmjjihy.jpg'),
  (1, 2, '2009-03-08', 13, '/zPMZ4EvBMQyAL5wnUsj4x6RgUnK.jpg'),
  (3, 1, '2011-04-17', 10, '/fHcK1cJjXL5YH2PXJRQ7wWzHfbY.jpg'),
  (5, 1, '2013-09-12', 6, '/e3T1F1oZZwAXYuCIgqoYp0W9i9K.jpg');

INSERT INTO episodes (season_id, show_id, episode_number, name, air_date, runtime, still_path, overview, vote_average) VALUES
  (1, 1, 1, 'Pilot', '2008-01-20', 58, '/s3TBrRGB1iC1fgsrSmla8AWoeJ.jpg', 'A high school chemistry teacher turns to manufacturing methamphetamine.', 7.8),
  (1, 1, 2, 'Cat''s in the Bag', '2008-01-27', 48, '/1W9lR4lI5hqzNkLQfnLKdEIlKq5.jpg', 'Walter and Jesse must cook their first batch.', 7.9),
  (3, 3, 1, 'Winter is Coming', '2011-04-17', 56, '/zLhEOicDj9WdoKL8XK07IQVvgqS.jpg', 'Lord Stark is asked to serve as Hand of the King.', 8.1),
  (4, 5, 1, 'Episode 1.1', '2013-09-12', 59, '/qXKB1c3hhzkAkKRcJpQS2xxWJ7r.jpg', 'A family of gangsters control the streets.', 8.0);

INSERT INTO show_watch_providers (show_id, provider_id, region, provider_type) VALUES
  (1, 1, 'US', 'flatrate'),
  (3, 1, 'US', 'flatrate'),
  (2, 2, 'US', 'buy'),
  (4, 2, 'US', 'flatrate');

INSERT INTO user_library (user_id, show_id, status, personal_rating, is_favorite, current_season, current_episode, date_started, hours_watched) VALUES
  (1, 1, 'completed', 9.5, true, 5, 16, '2024-01-15', 47.5),
  (1, 3, 'watching', 9.0, true, 2, 3, '2024-02-01', 12.0),
  (1, 2, 'completed', 8.5, false, NULL, NULL, '2024-01-10', 2.5),
  (1, 5, 'planning_to_watch', NULL, false, NULL, NULL, NULL, 0);

INSERT INTO user_episodes (user_id, episode_id, watched_date, personal_rating) VALUES
  (1, 1, '2024-01-15', 8.5),
  (1, 2, '2024-01-16', 9.0),
  (1, 3, '2024-02-01', 9.0);

INSERT INTO user_reviews (user_id, show_id, review_text, spoiler_flag) VALUES
  (1, 1, 'Absolutely phenomenal show! The character development of Walter White is unmatched.', false),
  (1, 3, 'Epic fantasy series with incredible world-building and complex characters.', false);

INSERT INTO user_lists (user_id, name, description) VALUES
  (1, 'Must Watch', 'Shows everyone should watch at least once'),
  (1, 'Currently Watching', 'Shows I''m actively watching now');

INSERT INTO list_items (list_id, show_id, position) VALUES
  (1, 1, 1),
  (1, 3, 2),
  (2, 3, 1),
  (2, 5, 2);

INSERT INTO user_preferences (user_id, favorite_genres, watch_time_preference, min_rating_threshold) VALUES
  (1, '[2, 3, 8]', 'evening', 7.5);

INSERT INTO chat_conversations (user_id, is_active) VALUES
  (1, true);

INSERT INTO chat_messages (conversation_id, role, content) VALUES
  (1, 'user', 'What shows should I watch next?'),
  (1, 'assistant', 'Based on your history with Breaking Bad, you might enjoy Peaky Blinders for its crime drama excellence.');

INSERT INTO ai_recommendations (user_id, conversation_id, recommended_show_id, recommendation_type, user_feedback) VALUES
  (1, 1, 5, 'conversational', 'liked');
