import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Track Ur Shows',
  description: 'Track and rate your favorite movies and TV shows',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <nav style={{ backgroundColor: '#f0f0f0', padding: '15px 20px', borderBottom: '1px solid #ddd' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '20px', fontWeight: 'bold', textDecoration: 'none', color: '#000' }}>
              Track Ur Shows
            </Link>
            <div style={{ display: 'flex', gap: '15px' }}>
              <Link href="/dashboard/movies" style={{ textDecoration: 'none', color: '#0070f3' }}>
                Dashboard
              </Link>
              <Link href="/login" style={{ textDecoration: 'none', color: '#0070f3' }}>
                Login
              </Link>
              <Link href="/register" style={{ textDecoration: 'none', color: '#0070f3' }}>
                Register
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
