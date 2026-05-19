'use client';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  Target, Percent, BarChart2, Briefcase,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent, formatDate, cn } from '@/lib/utils';
import api from '@/lib/api';

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/portfolio/dashboard') as any,
    refetchInterval: 30000,
  });

  const { data: activeTrades = [] } = useQuery({
    queryKey: ['active-trades-brief'],
    queryFn: () => api.get('/trades/active') as any,
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-24 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const pnl = Number(summary?.totalRealizedPnl ?? 0);
  const todayPnl = Number(summary?.todayPnl ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Portfolio Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your trading performance</p>
        </div>
        <Badge variant={pnl >= 0 ? 'profit' : 'loss'} className="text-sm px-3 py-1">
          {pnl >= 0 ? '↑' : '↓'} Overall {formatPercent(Number(summary?.roi ?? 0))} ROI
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Portfolio Value"
          value={summary?.currentCapital ?? 0}
          isCurrency
          icon={DollarSign}
          iconColor="text-primary"
        />
        <StatCard
          title="Total P&L"
          value={pnl}
          isCurrency
          icon={pnl >= 0 ? TrendingUp : TrendingDown}
          iconColor={pnl >= 0 ? 'text-profit' : 'text-loss'}
          className={pnl >= 0 ? 'border-profit/20' : 'border-loss/20'}
        />
        <StatCard
          title="Today's P&L"
          value={todayPnl}
          isCurrency
          icon={Activity}
          iconColor={todayPnl >= 0 ? 'text-profit' : 'text-loss'}
        />
        <StatCard
          title="Win Rate"
          value={summary?.winRate ?? 0}
          isPercent
          icon={Target}
          iconColor="text-blue-400"
        />
        <StatCard
          title="Available Capital"
          value={summary?.availableCapital ?? 0}
          isCurrency
          icon={Briefcase}
          iconColor="text-muted-foreground"
        />
        <StatCard
          title="Capital Used"
          value={summary?.capitalUtilization ?? 0}
          isPercent
          icon={Percent}
          iconColor="text-yellow-400"
        />
        <StatCard
          title="Total Trades"
          value={summary?.totalTrades ?? 0}
          icon={BarChart2}
          iconColor="text-purple-400"
        />
        <StatCard
          title="Open Trades"
          value={summary?.openTradesCount ?? 0}
          icon={Activity}
          iconColor="text-primary"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Monthly P&L chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Monthly P&L Performance</CardTitle>
          </CardHeader>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.monthlyPnl ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222,47%,11%)', border: '1px solid hsl(222,47%,18%)', borderRadius: '8px' }}
                  formatter={(v: number) => [formatCurrency(v), 'P&L']}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {(summary?.monthlyPnl ?? []).map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Win/Loss breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Breakdown</CardTitle>
          </CardHeader>
          <div className="space-y-4 mt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-profit">Winning</span>
                <span className="text-profit font-mono">{summary?.winningTrades ?? 0}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-profit h-2 rounded-full transition-all"
                  style={{ width: `${summary?.winRate ?? 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-loss">Losing</span>
                <span className="text-loss font-mono">{summary?.losingTrades ?? 0}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-loss h-2 rounded-full transition-all"
                  style={{ width: `${100 - (summary?.winRate ?? 0)}%` }}
                />
              </div>
            </div>
            <div className="pt-2 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brokerage Paid</span>
                <span className="text-foreground font-mono">{formatCurrency(Number(summary?.totalBrokerage ?? 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Drawdown</span>
                <span className="text-loss font-mono">{Number(summary?.maxDrawdown ?? 0).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active trades quick view */}
      {activeTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Trades</CardTitle>
            <a href="/active-trades" className="text-xs text-primary hover:underline">View all</a>
          </CardHeader>
          <div className="space-y-2">
            {activeTrades.slice(0, 5).map((trade: any) => {
              const pnlVal = Number(trade.unrealizedPnl ?? 0);
              return (
                <div key={trade.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{trade.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{trade.symbol}</p>
                      <p className="text-xs text-muted-foreground">Qty: {trade.entryQuantity} · Entry: {formatCurrency(Number(trade.entryPrice))}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-mono font-semibold', pnlVal >= 0 ? 'text-profit' : 'text-loss')}>
                      {formatCurrency(pnlVal)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(trade.entryDate)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
