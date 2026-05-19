'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Plus, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Watchlist</h1>
          <p className="text-sm text-muted-foreground">Track stocks you're monitoring</p>
        </div>
      </div>

      <div className="flex gap-3 max-w-sm">
        <Input
          value={addSymbol}
          onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
          placeholder="Add symbol (e.g. RELIANCE)"
          onKeyDown={(e) => e.key === 'Enter' && addSymbol && addItem(addSymbol)}
        />
        <Button onClick={() => addSymbol && addItem(addSymbol)} isLoading={adding} disabled={!addSymbol}>
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {(watchlists as any[]).map((list: any) => (
        <Card key={list.id}>
          <CardHeader>
            <CardTitle>{list.name} ({list.items?.length ?? 0})</CardTitle>
          </CardHeader>
          {list.items?.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No stocks in this watchlist yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {list.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 bg-secondary/40 rounded-lg group">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.symbol}</p>
                    {item.companyName && <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">{item.companyName}</p>}
                  </div>
                  <button
                    onClick={() => removeItem({ listId: list.id, symbol: item.symbol })}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-loss transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
