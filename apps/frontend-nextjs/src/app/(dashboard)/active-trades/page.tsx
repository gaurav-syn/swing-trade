'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, X, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ExitTradeModal } from '@/components/trades/ExitTradeModal';
import { formatCurrency, formatPercent, formatDate, cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ActiveTradesPage() {
  const qc = useQueryClient();
  const [exitingTrade, setExitingTrade] = useState<any>(null);

  const { data: trades = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['active-trades'],
    queryFn: () => api.get('/trades/active') as any,
    refetchInterval: 30000,
  });

  const { data: quotes } = useQuery({
    queryKey: ['live-quotes', (trades as any[]).map((t: any) => t.symbol).join(',')],
    queryFn: async () => {
      if (!(trades as any[]).length) return {};
      const symbols = (trades as any[]).map((t: any) => t.symbol).join(',');
      const data: any = await api.get(`/market-data/quotes?symbols=${symbols}`);
      return Object.fromEntries(data.map((q: any) => [q.symbol, q]));
    },
    enabled: (trades as any[]).length > 0,
    refetchInterval: 15000,
  });

  const { mutate: cancelTrade } = useMutation({
    mutationFn: (id: string) => api.patch(`/trades/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-trades'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Trade cancelled');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-40 bg-secondary rounded shimmer" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-card border border-border rounded-xl shimmer" />)}
      </div>
    );
  }

  const totalUnrealizedPnl = (trades as any[]).reduce((sum: number, t: any) => {
    const livePrice = quotes?.[t.symbol]?.price ?? Number(t.entryPrice);
    return sum + (livePrice - Number(t.entryPrice)) * t.entryQuantity;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Active Trades</h1>
          <p className="text-sm text-muted-foreground">
            {(trades as any[]).length} open position{(trades as any[]).length !== 1 ? 's' : ''}
            {(trades as any[]).length > 0 && (
              <span className={cn('ml-2 font-semibold', totalUnrealizedPnl >= 0 ? 'text-profit' : 'text-loss')}>
                {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnl)} unrealized
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {(trades as any[]).length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">No active trades</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Use the scanner to find opportunities</p>
          <Link href="/scanner">
            <Button variant="primary" size="sm">Go to Scanner</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {(trades as any[]).map((trade: any) => {
            const liveQuote    = quotes?.[trade.symbol];
            const livePrice    = liveQuote?.price ?? Number(trade.entryPrice);
            const unrealizedPnl = (livePrice - Number(trade.entryPrice)) * trade.entryQuantity;
            const unrealizedPct = ((livePrice - Number(trade.entryPrice)) / Number(trade.entryPrice)) * 100;
            const stopLossHit   = trade.stopLoss && livePrice <= Number(trade.stopLoss);
            const targetHit     = trade.target1  && livePrice >= Number(trade.target1);
            const isProfit      = unrealizedPnl >= 0;

            return (
              <Card
                key={trade.id}
                className={cn(
                  'transition-all',
                  stopLossHit ? 'border-loss/40 bg-loss/5 shadow-glow-red'
                    : targetHit ? 'border-profit/40 bg-profit/5 shadow-glow-green'
                    : '',
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Symbol avatar */}
                  <div className="w-11 h-11 bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{trade.symbol.slice(0, 2)}</span>
                  </div>

                  {/* Trade info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-foreground">{trade.symbol}</span>
                      <Badge variant="outline">{trade.exchange ?? 'NSE'}</Badge>
                      {stopLossHit && (
                        <Badge variant="loss"><AlertTriangle className="w-2.5 h-2.5 mr-1" />SL Hit</Badge>
                      )}
                      {targetHit && (
                        <Badge variant="profit"><CheckCircle className="w-2.5 h-2.5 mr-1" />Target</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs">
                      {[
                        { label: 'Entry',    val: formatCurrency(Number(trade.entryPrice)), className: 'text-foreground' },
                        { label: 'LTP',      val: formatCurrency(livePrice), className: cn(isProfit ? 'text-profit' : 'text-loss', 'font-semibold') },
                        { label: 'Qty',      val: trade.entryQuantity, className: 'text-foreground' },
                        { label: 'Invested', val: formatCurrency(Number(trade.investedAmount)), className: 'text-foreground' },
                        { label: 'Stop Loss', val: formatCurrency(Number(trade.stopLoss)), className: 'text-loss' },
                        { label: 'Target',   val: formatCurrency(Number(trade.target1)),  className: 'text-profit' },
                        { label: 'R:R',      val: `${Number(trade.riskRewardRatio ?? 0).toFixed(2)}x`, className: 'text-blue-400' },
                        { label: 'Since',    val: formatDate(trade.entryDate), className: 'text-muted-foreground' },
                      ].map(({ label, val, className }) => (
                        <div key={label}>
                          <span className="text-muted-foreground">{label} </span>
                          <span className={cn('font-mono font-medium tabular-nums', className)}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* P&L + actions */}
                  <div className="text-right shrink-0 space-y-1">
                    <p className={cn('text-lg font-bold font-mono tabular-nums', isProfit ? 'text-profit' : 'text-loss')}>
                      {unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)}
                    </p>
                    <p className={cn('text-xs font-mono', isProfit ? 'text-profit/70' : 'text-loss/70')}>
                      {formatPercent(unrealizedPct)}
                    </p>
                    <div className="flex gap-1.5 justify-end pt-1">
                      <Button variant="success" size="sm" onClick={() => setExitingTrade(trade)}>
                        Exit Trade
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelTrade(trade.id)}
                        className="w-7 h-7 p-0"
                      >
                        <X className="w-3.5 h-3.5" />
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
