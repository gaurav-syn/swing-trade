'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import api from '@/lib/api';

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics') as any,
  });
  const { data: winLoss } = useQuery({
    queryKey: ['analytics-winloss'],
    queryFn: () => api.get('/analytics/win-loss') as any,
  });

  if (isLoading) return <div className="h-96 bg-card border border-border rounded-xl shimmer" />;

  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Deep dive into your trading performance</p>
      </div>

      {/* Key metrics */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Win Rate', value: `${metrics.winRate}%`, color: metrics.winRate >= 55 ? 'text-profit' : 'text-loss' },
            { label: 'Profit Factor', value: metrics.profitFactor, color: metrics.profitFactor >= 1.5 ? 'text-profit' : 'text-loss' },
            { label: 'Avg Win', value: formatCurrency(metrics.avgWin), color: 'text-profit' },
            { label: 'Avg Loss', value: formatCurrency(metrics.avgLoss), color: 'text-loss' },
            { label: 'Total P&L', value: formatCurrency(metrics.totalPnl), color: metrics.totalPnl >= 0 ? 'text-profit' : 'text-loss' },
            { label: 'ROI', value: `${metrics.roi}%`, color: metrics.roi >= 0 ? 'text-profit' : 'text-loss' },
            { label: 'Avg Hold', value: `${metrics.avgHoldingDays} days`, color: 'text-foreground' },
            { label: 'Total Trades', value: metrics.totalTrades, color: 'text-foreground' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={cn('text-lg font-bold font-mono', color)}>{value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Equity curve */}
      {data?.equityCurve?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.equityCurve}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2962ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2962ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222,47%,11%)', border: '1px solid hsl(222,47%,18%)', borderRadius: '8px' }}
                  formatter={(v: number) => [formatCurrency(v), 'Portfolio']}
                />
                <Area type="monotone" dataKey="capital" stroke="#2962ff" fill="url(#equityGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Monthly + Drawdown */}
      <div className="grid grid-cols-2 gap-4">
        {data?.monthlyPerf?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Monthly Performance</CardTitle></CardHeader>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(222,47%,11%)', border: '1px solid hsl(222,47%,18%)', borderRadius: '8px' }}
                    formatter={(v: number) => [formatCurrency(v), 'P&L']}
                  />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {data.monthlyPerf.map((e: any, i: number) => (
                      <Cell key={i} fill={e.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {data?.drawdown?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Drawdown Analysis</CardTitle></CardHeader>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.drawdown}>
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `-${v}%`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(222,47%,11%)', border: '1px solid hsl(222,47%,18%)', borderRadius: '8px' }}
                    formatter={(v: number) => [`-${v}%`, 'Drawdown']}
                  />
                  <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="url(#ddGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Strategy + Symbol breakdown */}
      {data?.strategyBreakdown?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Strategy Performance</CardTitle></CardHeader>
          <div className="space-y-2">
            {data.strategyBreakdown.sort((a: any, b: any) => b.pnl - a.pnl).map((s: any) => (
              <div key={s.strategy} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.strategy}</p>
                  <p className="text-xs text-muted-foreground">{s.trades} trades · {s.winRate}% win rate</p>
                </div>
                <span className={cn('font-mono font-semibold text-sm', s.pnl >= 0 ? 'text-profit' : 'text-loss')}>
                  {formatCurrency(s.pnl)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
