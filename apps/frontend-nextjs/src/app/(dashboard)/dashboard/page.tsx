'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Wallet, TrendingUp, TrendingDown, Activity,
  Target, Percent, BarChart2, Briefcase, ArrowUpRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area,
} from 'recharts';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent, formatDate, cn } from '@/lib/utils';
import api from '@/lib/api';
import Link from 'next/link';

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'hsl(220,25%,9%)',
    border: '1px solid hsl(220,18%,17%)',
    borderRadius: '10px',
    fontSize: '12px',
    color: 'hsl(213,31%,94%)',
  },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

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
      <div className="space-y-6">
        <div className="h-7 w-48 bg-secondary rounded-lg shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-xl shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-64 bg-card border border-border rounded-xl shimmer" />
          <div className="h-64 bg-card border border-border rounded-xl shimmer" />
        </div>
      </div>
    );
  }

  const pnl     = Number(summary?.totalRealizedPnl ?? 0);
  const todayPnl = Number(summary?.todayPnl ?? 0);
  const roi      = Number(summary?.roi ?? 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Portfolio Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your trading performance at a glance</p>
        </div>
        <Badge variant={roi >= 0 ? 'profit' : 'loss'} className="text-xs px-3 py-1.5">
          {roi >= 0 ? '↑' : '↓'} {Math.abs(roi).toFixed(2)}% ROI
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Portfolio Value"    value={summary?.currentCapital ?? 0}     isCurrency iconClassName="stat-icon-blue"   icon={Wallet} />
        <StatCard
          title="Total P&L" value={pnl} isCurrency
          icon={pnl >= 0 ? TrendingUp : TrendingDown}
          iconClassName={pnl >= 0 ? 'stat-icon-green' : 'stat-icon-red'}
          valueClassName={pnl >= 0 ? 'text-profit' : 'text-loss'}
          className={pnl >= 0 ? 'border-profit/15' : 'border-loss/15'}
        />
        <StatCard
          title="Today's P&L" value={todayPnl} isCurrency
          icon={Activity}
          iconClassName={todayPnl >= 0 ? 'stat-icon-teal' : 'stat-icon-red'}
          valueClassName={todayPnl >= 0 ? 'text-profit' : 'text-loss'}
        />
        <StatCard title="Win Rate"          value={summary?.winRate ?? 0}             isPercent  iconClassName="stat-icon-blue"   icon={Target} />
        <StatCard title="Available Capital" value={summary?.availableCapital ?? 0}    isCurrency iconClassName="stat-icon-teal"   icon={Briefcase} />
        <StatCard title="Capital Deployed"  value={summary?.capitalUtilization ?? 0}  isPercent  iconClassName="stat-icon-yellow" icon={Percent} />
        <StatCard title="Total Trades"      value={summary?.totalTrades ?? 0}         iconClassName="stat-icon-purple"           icon={BarChart2} />
        <StatCard title="Open Positions"    value={summary?.openTradesCount ?? 0}     iconClassName="stat-icon-blue"             icon={Activity} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Monthly P&L bar chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Monthly P&L Performance</CardTitle>
            <span className="text-[11px] text-muted-foreground">Last 12 months</span>
          </CardHeader>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.monthlyPnl ?? []} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,17%)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: number) => [formatCurrency(v), 'P&L']} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {(summary?.monthlyPnl ?? []).map((e: any, i: number) => (
                    <Cell key={i} fill={e.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Win/Loss breakdown */}
        <Card>
          <CardHeader><CardTitle>Trade Breakdown</CardTitle></CardHeader>
          <div className="space-y-5 mt-1">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Winning trades</span>
                <span className="font-semibold text-profit font-tabular">{summary?.winningTrades ?? 0}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-profit h-2 rounded-full transition-all duration-500" style={{ width: `${summary?.winRate ?? 0}%` }} />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Losing trades</span>
                <span className="font-semibold text-loss font-tabular">{summary?.losingTrades ?? 0}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-loss h-2 rounded-full transition-all duration-500" style={{ width: `${100 - (summary?.winRate ?? 0)}%` }} />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              {[
                { label: 'Brokerage Paid',  val: formatCurrency(Number(summary?.totalBrokerage ?? 0)), color: 'text-foreground' },
                { label: 'Max Drawdown',    val: `${Number(summary?.maxDrawdown ?? 0).toFixed(2)}%`,    color: 'text-loss' },
                { label: 'Total Invested',  val: formatCurrency(Number(summary?.totalInvested ?? 0)),   color: 'text-foreground' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={cn('font-mono font-semibold tabular-nums', color)}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Active trades quick view */}
      {(activeTrades as any[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open Positions</CardTitle>
            <Link href="/active-trades" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-border">
            {(activeTrades as any[]).slice(0, 5).map((trade: any) => {
              const pnlVal = Number(trade.unrealizedPnl ?? 0);
              return (
                <div key={trade.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 rounded-xl flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{trade.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{trade.symbol}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {trade.entryQuantity} shares · {formatCurrency(Number(trade.entryPrice))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold font-mono tabular-nums', pnlVal >= 0 ? 'text-profit' : 'text-loss')}>
                      {pnlVal >= 0 ? '+' : ''}{formatCurrency(pnlVal)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(trade.entryDate)}</p>
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
