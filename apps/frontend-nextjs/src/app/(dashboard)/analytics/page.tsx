'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import api from '@/lib/api';

const TOOLTIP = {
  contentStyle: {
    background: 'hsl(220,25%,9%)',
    border: '1px solid hsl(220,18%,17%)',
    borderRadius: '10px',
    fontSize: '12px',
    color: 'hsl(213,31%,94%)',
  },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics') as any,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-32 bg-secondary rounded shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-card border border-border rounded-xl shimmer" />)}
        </div>
        <div className="h-64 bg-card border border-border rounded-xl shimmer" />
      </div>
    );
  }

  const metrics = data?.metrics;

  const keyMetrics = metrics ? [
    { label: 'Win Rate',      value: `${metrics.winRate}%`,            good: metrics.winRate >= 55,    isPositive: metrics.winRate >= 55 },
    { label: 'Profit Factor', value: String(metrics.profitFactor),      good: metrics.profitFactor >= 1.5, isPositive: metrics.profitFactor >= 1 },
    { label: 'Avg Win',       value: formatCurrency(metrics.avgWin),    good: true, isPositive: true },
    { label: 'Avg Loss',      value: formatCurrency(Math.abs(metrics.avgLoss)), good: false, isPositive: false },
    { label: 'Total P&L',     value: formatCurrency(metrics.totalPnl),  good: metrics.totalPnl >= 0, isPositive: metrics.totalPnl >= 0 },
    { label: 'ROI',           value: `${metrics.roi}%`,                 good: metrics.roi >= 0,       isPositive: metrics.roi >= 0 },
    { label: 'Avg Hold',      value: `${metrics.avgHoldingDays}d`,      good: true, isPositive: true },
    { label: 'Total Trades',  value: String(metrics.totalTrades),       good: true, isPositive: true },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Deep dive into your trading performance</p>
      </div>

      {/* Key metrics grid */}
      {keyMetrics.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {keyMetrics.map(({ label, value, good, isPositive }) => (
            <div
              key={label}
              className={cn(
                'bg-card border rounded-xl p-4 text-center',
                good ? 'border-profit/15' : 'border-border',
              )}
            >
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
              <p className={cn(
                'text-xl font-bold font-mono tabular-nums',
                isPositive ? 'text-profit' : label === 'Avg Loss' ? 'text-loss' : 'text-foreground',
              )}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Equity curve */}
      {data?.equityCurve?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
            <span className="text-[11px] text-muted-foreground font-mono">
              {formatCurrency(data.equityCurve[data.equityCurve.length - 1]?.capital ?? 0)}
            </span>
          </CardHeader>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.equityCurve}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(213,94%,68%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(213,94%,68%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,17%)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip {...TOOLTIP} formatter={(v: number) => [formatCurrency(v), 'Portfolio']} />
                <Area type="monotone" dataKey="capital" stroke="hsl(213,94%,68%)" strokeWidth={2} fill="url(#equityGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Monthly + Drawdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data?.monthlyPerf?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Monthly Performance</CardTitle></CardHeader>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyPerf} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,17%)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip {...TOOLTIP} formatter={(v: number) => [formatCurrency(v), 'P&L']} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {data.monthlyPerf.map((e: any, i: number) => (
                      <Cell key={i} fill={e.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {data?.drawdown?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Drawdown Analysis</CardTitle>
              <span className="text-xs text-loss font-mono">Max: -{Math.max(...data.drawdown.map((d: any) => d.drawdown)).toFixed(2)}%</span>
            </CardHeader>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.drawdown}>
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,17%)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `-${v}%`} />
                  <Tooltip {...TOOLTIP} formatter={(v: number) => [`-${v}%`, 'Drawdown']} />
                  <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} fill="url(#ddGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Strategy breakdown */}
      {data?.strategyBreakdown?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Strategy Performance</CardTitle></CardHeader>
          <div className="space-y-2">
            {[...data.strategyBreakdown].sort((a: any, b: any) => b.pnl - a.pnl).map((s: any) => {
              const isPos = s.pnl >= 0;
              return (
                <div key={s.strategy} className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.strategy}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.trades} trades · <span className={s.winRate >= 55 ? 'text-profit' : 'text-loss'}>{s.winRate}% win rate</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-mono font-bold text-sm tabular-nums', isPos ? 'text-profit' : 'text-loss')}>
                      {formatCurrency(s.pnl)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatPercent(s.roi ?? 0)} ROI</p>
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
