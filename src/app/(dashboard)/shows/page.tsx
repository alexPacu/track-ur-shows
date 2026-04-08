'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShowsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <p className="text-text-muted">Redirecting to dashboard...</p>
    </div>
  );
}
