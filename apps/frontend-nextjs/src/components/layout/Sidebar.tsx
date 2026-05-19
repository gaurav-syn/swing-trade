'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, TrendingUp, History,
  BarChart2, Star, Settings, LogOut, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scanner', label: 'Scanner', icon: Search },
  { href: '/active-trades', label: 'Active Trades', icon: TrendingUp },
  { href: '/trade-history', label: 'Trade History', icon: History },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-card border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">SwingTrader</p>
            <p className="text-[10px] text-muted-foreground">Pro Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        <div className="px-3 py-2.5">
          <p className="text-xs font-medium text-foreground truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
