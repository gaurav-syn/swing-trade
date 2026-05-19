'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface IndexData {
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function TopBar() {
  const { data: indices = [] } = useQuery<IndexData[]>({
    queryKey: ['market-indices'],
    queryFn: () => api.get('/market-data/indices') as any,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  return (
    <header className="fixed top-0 left-56 right-0 h-12 bg-card border-b border-border flex items-center px-4 gap-6 z-40">
      {indices.map((idx) => (
        <div key={idx.name} className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{idx.name}</span>
          <span className="text-xs font-mono font-semibold text-foreground">
            {idx.price?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className={cn('flex items-center text-xs', idx.change >= 0 ? 'text-profit' : 'text-loss')}>
            {idx.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {idx.changePercent?.toFixed(2)}%
          </span>
        </div>
      ))}
      <div className="ml-auto">
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
    </header>
  );
}
