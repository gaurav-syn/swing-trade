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
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/scanner',       label: 'Scanner',        icon: Search },
  { href: '/active-trades', label: 'Active Trades',  icon: TrendingUp },
  { href: '/trade-history', label: 'Trade History',  icon: History },
  { href: '/analytics',     label: 'Analytics',      icon: BarChart2 },
  { href: '/watchlist',     label: 'Watchlist',       icon: Star },
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
    <aside className="fixed left-0 top-0 h-full w-56 bg-card border-r border-border flex flex-col z-50 shadow-card">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/25 rounded-xl flex items-center justify-center shadow-glow-blue">
            <Zap className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground leading-none">SwingTrader</p>
            <p className="text-[10px] text-primary/70 font-medium tracking-widest uppercase mt-0.5">Pro Platform</p>
          </div>
        </div>
      </div>

      {/* Market status pill */}
      <div className="px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-profit rounded-full animate-pulse" />
          <span className="text-[11px] text-muted-foreground">NSE/BSE Live</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative',
                active
                  ? 'nav-active text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary' : '')} />
              <span>{label}</span>
              {active && (
                <span className="absolute right-2 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 pt-2 border-t border-border space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
            pathname === '/settings'
              ? 'nav-active text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </Link>

        {/* User row */}
        <div className="px-3 py-2.5 rounded-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-primary">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
