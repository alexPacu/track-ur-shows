'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { buildImageUrl } from '@/lib/tmdb';
import { SearchIcon, UsersIcon } from '@/components/Icons';

interface FeedItem {
  id: number;
  user_id: number;
  username: string;
  profile_picture_url: string | null;
  action: string;
  created_at: string;
  tmdb_id: number;
  title: string | null;
  poster_path: string | null;
  media_type: string | null;
}

interface FollowUser {
  id: number;
  username: string;
  profile_picture_url: string | null;
}

interface SearchUser extends FollowUser {
  isFollowing: boolean;
}

const ACTION_TEXT: Record<string, string> = {
  added: 'added',
  status_change: 'updated status for',
  rating: 'rated',
  favorite: 'favorited',
  progress: 'updated progress on',
  removed: 'removed from watchlist',
};

function parseUtc(date: string) {
  return new Date(date.endsWith('Z') || date.includes('+') ? date : date + 'Z');
}

function timeAgo(date: string) {
  const diff = Date.now() - parseUtc(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return parseUtc(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ user, size = 36 }: { user: { username: string; profile_picture_url: string | null }; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden bg-accent-blue/20 flex items-center justify-center font-bold text-accent-blue flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {user.profile_picture_url ? (
        <img src={user.profile_picture_url} alt={user.username} className="w-full h-full object-cover" />
      ) : (
        <span>{user.username[0]?.toUpperCase()}</span>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const [tab, setTab] = useState<'feed' | 'friends'>('feed');

  // feed
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // friends
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);

  // search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadFeed(1, true);
  }, []);

  const loadFeed = async (page: number, replace = false) => {
    if (replace) setFeedLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(`/api/feed?page=${page}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setFeed((prev) => (replace ? json.feed : [...prev, ...json.feed]));
        setHasMore(json.hasMore);
        setFeedPage(page);
      }
    } finally {
      setFeedLoading(false);
      setLoadingMore(false);
    }
  };

  const loadFriends = async () => {
    if (friendsLoaded) return;
    setFriendsLoading(true);
    try {
      const [followingRes, followersRes] = await Promise.all([
        fetch('/api/users/me/following', { credentials: 'include' }),
        fetch('/api/users/me/followers', { credentials: 'include' }),
      ]);
      if (followingRes.ok) setFollowing(await followingRes.json().then((r) => r.following));
      if (followersRes.ok) setFollowers(await followersRes.json().then((r) => r.followers));
      setFriendsLoaded(true);
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleTabChange = (t: 'feed' | 'friends') => {
    setTab(t);
    if (t === 'friends') loadFriends();
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setSearchResults(json.users ?? []);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleFollow = async (userId: number, currentlyFollowing: boolean) => {
    const method = currentlyFollowing ? 'DELETE' : 'POST';
    const res = await fetch(`/api/users/${userId}/follow`, { method, credentials: 'include' });
    if (!res.ok) return;

    setSearchResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: !currentlyFollowing } : u))
    );

    if (currentlyFollowing) {
      setFollowing((prev) => prev.filter((u) => u.id !== userId));
    } else {
      const target = searchResults.find((u) => u.id === userId);
      if (target) setFollowing((prev) => [target, ...prev]);
    }
  };

  const handleUnfollow = async (userId: number) => {
    const res = await fetch(`/api/users/${userId}/follow`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) setFollowing((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-[1480px] mx-auto px-10 pt-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">Friends</h1>
          <p className="text-text-muted text-sm mt-1.5">Follow people and see what they&apos;re watching.</p>
        </div>

        <div className="flex gap-1 mb-8 border-b border-white/[0.06]">
          {(['feed', 'friends'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                tab === t
                  ? 'text-accent-blue border-accent-blue'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'feed' && (
          <div className="max-w-2xl">
            {feedLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="modern-panel rounded-2xl p-4 animate-pulse h-20" />
                ))}
              </div>
            ) : feed.length === 0 ? (
              <div className="modern-panel rounded-2xl p-10 text-center">
                <UsersIcon className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-primary font-semibold mb-1">No activity yet</p>
                <p className="text-text-muted text-sm">Follow some friends to see their activity here.</p>
                <button
                  onClick={() => handleTabChange('friends')}
                  className="mt-4 px-5 py-2 text-sm font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/30 rounded-xl hover:bg-accent-blue/25 transition-colors"
                >
                  Find friends
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {feed.map((item) => (
                  <div key={item.id} className="modern-panel rounded-2xl p-4 flex items-center gap-4">
                    <Link href={`/u/${item.username}`}>
                      <Avatar user={{ username: item.username, profile_picture_url: item.profile_picture_url }} size={40} />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm leading-snug">
                        <Link href={`/u/${item.username}`} className="font-semibold hover:text-accent-blue transition-colors">
                          {item.username}
                        </Link>
                        {' '}
                        <span className="text-text-muted">{ACTION_TEXT[item.action] ?? item.action}</span>
                        {item.title && item.media_type && (
                          <>
                            {' '}
                            <Link
                              href={item.media_type === 'tv' ? `/dashboard/shows/${item.tmdb_id}` : `/dashboard/movies/${item.tmdb_id}`}
                              className="font-semibold hover:text-accent-blue transition-colors"
                            >
                              {item.title}
                            </Link>
                          </>
                        )}
                      </p>
                      <p className="text-text-muted text-xs mt-0.5">{timeAgo(item.created_at)}</p>
                    </div>
                    {item.poster_path && item.media_type && (
                      <Link href={item.media_type === 'tv' ? `/dashboard/shows/${item.tmdb_id}` : `/dashboard/movies/${item.tmdb_id}`}>
                        <Image
                          src={buildImageUrl(item.poster_path, 'w92') ?? ''}
                          alt={item.title ?? ''}
                          width={36}
                          height={54}
                          className="rounded object-cover flex-shrink-0"
                        />
                      </Link>
                    )}
                  </div>
                ))}
                {hasMore && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => loadFeed(feedPage + 1)}
                      disabled={loadingMore}
                      className="px-6 py-2.5 text-sm font-semibold bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded-xl hover:bg-accent-blue/20 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* friends tab */}
        {tab === 'friends' && (
          <div className="max-w-2xl space-y-8">
            <div className="modern-panel rounded-2xl p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-0.5 h-4 rounded-full bg-accent-blue" style={{ boxShadow: '0 0 8px rgba(137,207,240,0.5)' }} />
                <p className="text-text-primary text-sm font-semibold tracking-tight">Find people</p>
              </div>
              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by username…"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-bg-deep border border-white/[0.07] rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/40 transition-colors"
                />
              </div>
              {searchLoading && (
                <p className="text-text-muted text-xs mt-3">Searching…</p>
              )}
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {searchResults.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <Link href={`/u/${u.username}`}>
                        <Avatar user={u} size={36} />
                      </Link>
                      <Link href={`/u/${u.username}`} className="flex-1 text-sm font-semibold text-text-primary hover:text-accent-blue transition-colors">
                        {u.username}
                      </Link>
                      <button
                        onClick={() => handleFollow(u.id, u.isFollowing)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          u.isFollowing
                            ? 'border-white/20 text-text-muted hover:border-red-500/50 hover:text-red-400'
                            : 'border-accent-blue/40 text-accent-blue hover:bg-accent-blue/10'
                        }`}
                      >
                        {u.isFollowing ? 'Unfollow' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
                <p className="text-text-muted text-sm mt-3">No users found.</p>
              )}
            </div>

            {/* following list */}
            <div className="modern-panel rounded-2xl p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-0.5 h-4 rounded-full bg-accent-blue" style={{ boxShadow: '0 0 8px rgba(137,207,240,0.5)' }} />
                <p className="text-text-primary text-sm font-semibold tracking-tight">Following</p>
                {following.length > 0 && (
                  <span className="ml-auto text-xs text-text-muted">{following.length}</span>
                )}
              </div>
              {friendsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 bg-bg-card rounded animate-pulse" />
                  ))}
                </div>
              ) : following.length === 0 ? (
                <p className="text-text-muted text-sm py-2">You&apos;re not following anyone yet.</p>
              ) : (
                <div className="space-y-2">
                  {following.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <Link href={`/u/${u.username}`}>
                        <Avatar user={u} size={36} />
                      </Link>
                      <Link href={`/u/${u.username}`} className="flex-1 text-sm font-semibold text-text-primary hover:text-accent-blue transition-colors">
                        {u.username}
                      </Link>
                      <button
                        onClick={() => handleUnfollow(u.id)}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-white/20 text-text-muted hover:border-red-500/50 hover:text-red-400 transition-colors"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* followers listed */}
            <div className="modern-panel rounded-2xl p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-0.5 h-4 rounded-full bg-accent-blue" style={{ boxShadow: '0 0 8px rgba(137,207,240,0.5)' }} />
                <p className="text-text-primary text-sm font-semibold tracking-tight">Followers</p>
                {followers.length > 0 && (
                  <span className="ml-auto text-xs text-text-muted">{followers.length}</span>
                )}
              </div>
              {friendsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 bg-bg-card rounded animate-pulse" />
                  ))}
                </div>
              ) : followers.length === 0 ? (
                <p className="text-text-muted text-sm py-2">No followers yet.</p>
              ) : (
                <div className="space-y-2">
                  {followers.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <Link href={`/u/${u.username}`}>
                        <Avatar user={u} size={36} />
                      </Link>
                      <Link href={`/u/${u.username}`} className="flex-1 text-sm font-semibold text-text-primary hover:text-accent-blue transition-colors">
                        {u.username}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
