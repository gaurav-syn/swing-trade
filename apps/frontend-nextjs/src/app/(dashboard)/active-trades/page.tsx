'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ExitTradeModal } from '@/components/trades/ExitTradeModal';
import { formatCurrency, formatPercent, formatDate, cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ActiveTradesPage() {
  const qc = useQueryClient();
  const [exitingTrade, setExitingTrade] = useState<any>(null);

  const { data: trades = [], isLoading, refetch } = useQuery({
    queryKey: ['active-trades'],
    queryFn: () => api.get('/trades/active') as any,
    refetchInterval: 30000,
  });

  const { data: quotes } = useQuery({
    queryKey: ['live-quotes', trades.map((t: any) => t.symbol)],
    queryFn: async () => {
      if (!trades.length) return {};
      const symbols = trades.map((t: any) => t.symbol).join(',');
      const data: any = await api.get(`/market-data/quotes?symbols=${symbols}`);
      return Object.fromEntries(data.map((q: any) => [q.symbol, q]));
    },
    enabled: trades.length > 0,
    refetchInterval: 15000,
  });

  const { mutate: cancelTrade, isPending: cancelling } = useMutation({
    mutationFn: (id: string) => api.patch(`/trades/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-trades'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Trade cancelled');
    },
  });

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-card border border-border rounded-xl shimmer" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Active Trades</h1>
          <p className="text-sm text-muted-foreground">{trades.length} open position{trades.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {trades.length === 0 ? (
        <Card className="text-center py-16">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No active trades</p>
          <p className="text-xs text-muted-foreground mt-1">Use the scanner to find opportunities</p>
          <a href="/scanner" className="inline-block mt-3 text-xs text-primary hover:underline">Go to Scanner →</a>
        </Card>
      ) : (
        <div className="space-y-3">
          {trades.map((trade: any) => {
            const liveQuote = quotes?.[trade.symbol];
            const livePrice = liveQuote?.price ?? Number(trade.entryPrice);
            const unrealizedPnl = (livePrice - Number(trade.entryPrice)) * trade.entryQuantity;
            const unrealizedPct = ((livePrice - Number(trade.entryPrice)) / Number(trade.entryPrice)) * 100;
            const investedAmount = Number(trade.investedAmount);
            const stopLossHit = trade.stopLoss && livePrice <= Number(trade.stopLoss);
            const targetHit = trade.target1 && livePrice >= Number(trade.target1);

            return (
              <Card key={trade.id} className={cn(
                'border transition-colors',
                stopLossHit ? 'border-loss/40 bg-loss/5' : targetHit ? 'border-profit/40 bg-profit/5' : '',
              )}>
                <div className="flex items-start gap-4">
                  {/* Symbol */}
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{trade.symbol.slice(0, 2)}</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">{trade.symbol}</span>
                      <Badge variant="outline">{trade.exchange}</Badge>
                      {stopLossHit && <Badge variant="loss"><AlertTriangle className="w-3 h-3 mr-1" />Stop Loss Hit</Badge>}
                      {targetHit && <Badge variant="profit">Target Hit</Badge>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs">
                      <div>
                        <span className="text-muted-foreground">Entry </span>
                        <span className="font-mono text-foreground">{formatCurrency(Number(trade.entryPrice))}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">LTP </span>
                        <span className="font-mono text-foreground">{formatCurrency(livePrice)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Qty </span>
                        <span className="font-mono text-foreground">{trade.entryQuantity}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Invested </span>
                        <span className="font-mono text-foreground">{formatCurrency(investedAmount)}</span>
                      </div>
                      {trade.stopLoss && (
                        <div>
                          <span className="text-muted-foreground">SL </span>
                          <span className="font-mono text-loss">{formatCurrency(Number(trade.stopLoss))}</span>
                        </div>
                      )}
                      {trade.target1 && (
                        <div>
                          <span className="text-muted-foreground">Target </span>
                          <span className="font-mono text-profit">{formatCurrency(Number(trade.target1))}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Entered </span>
                        <span className="text-foreground">{formatDate(trade.entryDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* P&L */}
                  <div className="text-right shrink-0">
                    <p className={cn('text-lg font-bold font-mono', unrealizedPnl >= 0 ? 'text-profit' : 'text-loss')}>
                      {unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)}
                    </p>
                    <p className={cn('text-sm font-mono', unrealizedPnl >= 0 ? 'text-profit' : 'text-loss')}>
                      {formatPercent(unrealizedPct)}
                    </p>
                    <div className="flex gap-2 mt-2 justify-end">
                      <Button variant="success" size="sm" onClick={() => setExitingTrade(trade)}>
                        Exit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => cancelTrade(trade.id)} disabled={cancelling}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {exitingTrade && (
        <ExitTradeModal
          trade={exitingTrade}
          onClose={() => setExitingTrade(null)}
          onSuccess={() => {
            setExitingTrade(null);
            qc.invalidateQueries({ queryKey: ['active-trades'] });
            qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
          }}
        />
      )}
    </div>
  );
}
