import { Navbar } from '@/components/Navbar';

export default function UserProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-dark">
      <Navbar />
      <main className="flex-1 pt-4">{children}</main>
    </div>
  );
}
