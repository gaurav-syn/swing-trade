'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function WatchlistPage() {
  const qc = useQueryClient();
  const [addSymbol, setAddSymbol] = useState('');

  const { data: watchlists = [] } = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => api.get('/watchlists') as any,
  });

  const defaultList = (watchlists as any[]).find(w => w.isDefault);

  const { mutate: addItem, isPending: adding } = useMutation({
    mutationFn: (symbol: string) =>
      api.post(`/watchlists/${defaultList?.id}/items`, { symbol: symbol.toUpperCase() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlists'] });
      setAddSymbol('');
      toast.success('Added to watchlist');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Already in watchlist'),
  });

  const { mutate: removeItem } = useMutation({
    mutationFn: ({ listId, symbol }: { listId: string; symbol: string }) =>
      api.delete(`/watchlists/${listId}/items/${symbol}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlists'] }),
  });

  const totalItems = (watchlists as any[]).reduce((s: number, w: any) => s + (w.items?.length ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Watchlist</h1>
          <p className="text-sm text-muted-foreground">{totalItems} stocks being monitored</p>
        </div>
      </div>

      {/* Add stock */}
      <Card>
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Add Symbol</label>
            <div className="flex gap-2">
              <input
                value={addSymbol}
                onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && addSymbol && addItem(addSymbol)}
                placeholder="e.g. RELIANCE, TCS, INFY"
                className="flex-1 h-10 bg-input border border-border rounded-lg text-sm text-foreground px-3 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
              />
              <Button
                onClick={() => addSymbol && addItem(addSymbol)}
                isLoading={adding}
                disabled={!addSymbol || !defaultList}
                size="md"
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pb-2">NSE symbols only · Press Enter to add</p>
        </div>
      </Card>

      {/* Watchlists */}
      {(watchlists as any[]).length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">No watchlist yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first stock above</p>
        </Card>
      ) : (
        (watchlists as any[]).map((list: any) => (
          <Card key={list.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <CardTitle>{list.name}</CardTitle>
                <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {list.items?.length ?? 0}
                </span>
              </div>
            </CardHeader>
            {!list.items?.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No stocks added yet — type a symbol above and press Enter
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {list.items.map((item: any) => {
                  const change = item.changePercent ?? 0;
                  const isUp   = change >= 0;
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-3 bg-secondary/40 hover:bg-secondary/70 border border-border/50 hover:border-border rounded-xl transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">{item.symbol}</p>
                        {item.companyName && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">{item.companyName}</p>
                        )}
                        {item.currentPrice && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs font-mono text-foreground tabular-nums">{formatCurrency(item.currentPrice)}</span>
                            <span className={cn('text-[10px] font-medium flex items-center gap-0.5', isUp ? 'text-profit' : 'text-loss')}>
                              {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {Math.abs(change).toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem({ listId: list.id, symbol: item.symbol })}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-loss hover:bg-loss/15 transition-all shrink-0 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
