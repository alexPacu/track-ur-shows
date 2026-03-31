'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUserName(data.user?.username);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1>Welcome to Track Ur Shows</h1>
      <p>Track and rate your favorite movies and TV shows</p>

      {isLoggedIn ? (
        <div>
          <p>Welcome back, {userName}!</p>
          <Link href="/dashboard/movies" style={{ color: '#0070f3', textDecoration: 'none' }}>
            Go to Dashboard →
          </Link>
        </div>
      ) : (
        <div>
          <p>
            <Link href="/login" style={{ color: '#0070f3', textDecoration: 'none', marginRight: '20px' }}>
              Login
            </Link>
            <Link href="/register" style={{ color: '#0070f3', textDecoration: 'none' }}>
              Register
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
