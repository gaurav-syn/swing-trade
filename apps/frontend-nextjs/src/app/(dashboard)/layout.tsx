'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadUser().then(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.push('/login');
      }
    });
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main className="ml-56 mt-12 p-6 min-h-[calc(100vh-3rem)]">
        {children}
      </main>
    </div>
  );
}
