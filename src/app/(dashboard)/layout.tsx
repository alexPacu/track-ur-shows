'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {   // check if user is authenticated
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {  // user is authenticated
          setIsAuthenticated(true);
        } else if (response.status === 401) { // not loged in -> back to login page
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-dark">
      <Navbar />
      <main className="flex-1 pt-4">{children}</main>
    </div>
  );
}
