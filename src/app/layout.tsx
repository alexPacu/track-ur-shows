import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Track Ur Shows',
  description: 'Track and rate your favorite movies and TV shows',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
