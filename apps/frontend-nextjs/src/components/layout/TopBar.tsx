'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Bell, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface IndexData {
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function TopBar() {
  const { data: indices = [], isFetching } = useQuery<IndexData[]>({
    queryKey: ['market-indices'],
    queryFn: () => api.get('/market-data/indices') as any,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="fixed top-0 left-56 right-0 h-12 bg-card/95 backdrop-blur border-b border-border flex items-center px-5 gap-1 z-40">
      {/* Market indices */}
      <div className="flex items-center gap-5 flex-1 overflow-hidden">
        {indices.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} />
            <span>Loading indices...</span>
          </div>
        ) : (
          indices.map((idx) => {
            const up = (idx.changePercent ?? 0) >= 0;
            return (
              <div key={idx.name} className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium text-muted-foreground">{idx.name}</span>
                <span className="text-[12px] font-semibold font-mono text-foreground tabular-nums">
                  {idx.price?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className={cn(
                  'flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded',
                  up ? 'text-profit bg-profit/10' : 'text-loss bg-loss/10',
                )}>
                  {up
                    ? <TrendingUp className="w-2.5 h-2.5" />
                    : <TrendingDown className="w-2.5 h-2.5" />
                  }
                  {Math.abs(idx.changePercent ?? 0).toFixed(2)}%
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
        {isFetching && <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />}
        <div className="w-px h-4 bg-border" />
        <span className="text-[11px] text-muted-foreground">{dateStr}</span>
        <button className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
