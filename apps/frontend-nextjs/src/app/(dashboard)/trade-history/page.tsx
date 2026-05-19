'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, History, TrendingUp, TrendingDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent, formatDate, cn, downloadCsv } from '@/lib/utils';
import api from '@/lib/api';

const TH_COLS = ['Symbol', 'Type', 'Entry', 'Exit', 'Entry ₹', 'Exit ₹', 'Qty', 'Gross P&L', 'Net P&L', 'Return', 'Days', 'Strategy'];

export default function TradeHistoryPage() {
  const [page, setPage]         = useState(1);
  const [symbol, setSymbol]     = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trade-history', page, symbol, fromDate, toDate],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (symbol)   p.set('symbol',   symbol);
      if (fromDate) p.set('fromDate', fromDate);
      if (toDate)   p.set('toDate',   toDate);
      return api.get(`/trades/history?${p}`) as any;
    },
  });

  const handleExport = async () => {
    const exportData: any = await api.get('/analytics/export');
    downloadCsv(exportData.csv, `trades-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const clearFilters = () => { setSymbol(''); setFromDate(''); setToDate(''); setPage(1); };
  const hasFilters = symbol || fromDate || toDate;

  const trades     = data?.trades ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Trade History</h1>
          <p className="text-sm text-muted-foreground">{pagination?.total ?? 0} closed trades</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={symbol}
              onChange={(e) => { setSymbol(e.target.value.toUpperCase()); setPage(1); }}
              placeholder="Symbol…"
              className="h-9 pl-8 pr-3 w-32 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <Input label="From" type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="w-36" />
          <Input label="To"   type="date" value={toDate}   onChange={(e) => { setToDate(e.target.value);   setPage(1); }} className="w-36" />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {TH_COLS.map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap bg-secondary/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(12)].map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3.5 bg-secondary rounded shimmer" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <History className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">No closed trades yet</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Exit an active trade to see it here</p>
                  </td>
                </tr>
              ) : (
                trades.map((trade: any) => {
                  const pnl    = Number(trade.netPnl ?? 0);
                  const isWin  = pnl >= 0;
                  return (
                    <tr key={trade.id} className="table-row-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 rounded-lg flex items-center justify-center">
                            <span className="text-[9px] font-bold text-primary">{trade.symbol.slice(0, 2)}</span>
                          </div>
                          <span className="font-semibold text-foreground">{trade.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={trade.tradeType === 'LONG' ? 'info' : 'warning'}>
                          {trade.tradeType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(trade.entryDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(trade.exitDate)}</td>
                      <td className="px-4 py-3 font-mono text-foreground tabular-nums">{formatCurrency(Number(trade.entryPrice))}</td>
                      <td className="px-4 py-3 font-mono text-foreground tabular-nums">{formatCurrency(Number(trade.exitPrice))}</td>
                      <td className="px-4 py-3 text-foreground">{trade.entryQuantity}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        <span className={isWin ? 'text-profit' : 'text-loss'}>
                          {formatCurrency(Number(trade.realizedPnl ?? 0))}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold tabular-nums">
                        <div className="flex items-center gap-1">
                          {isWin
                            ? <TrendingUp className="w-3 h-3 text-profit shrink-0" />
                            : <TrendingDown className="w-3 h-3 text-loss shrink-0" />}
                          <span className={isWin ? 'text-profit' : 'text-loss'}>{formatCurrency(pnl)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-semibold',
                          isWin ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss',
                        )}>
                          {formatPercent(Number(trade.realizedPnlPercent ?? 0))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{trade.holdingDays ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{trade.strategy ?? '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/20">
            <span className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} trades
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}>Next →</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
