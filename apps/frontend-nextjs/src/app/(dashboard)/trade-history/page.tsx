'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Filter, History, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent, formatDate, formatDateTime, cn, downloadCsv } from '@/lib/utils';
import api from '@/lib/api';

export default function TradeHistoryPage() {
  const [page, setPage] = useState(1);
  const [symbol, setSymbol] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trade-history', page, symbol, fromDate, toDate],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (symbol) params.set('symbol', symbol);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      return api.get(`/trades/history?${params}`) as any;
    },
  });

  const handleExport = async () => {
    const exportData: any = await api.get('/analytics/export');
    downloadCsv(exportData.csv, `trades-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const trades = data?.trades ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Trade History</h1>
          <p className="text-sm text-muted-foreground">
            {pagination?.total ?? 0} closed trades
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-36">
            <Input label="Symbol" value={symbol} onChange={(e) => { setSymbol(e.target.value.toUpperCase()); setPage(1); }} placeholder="RELIANCE" />
          </div>
          <div className="w-36">
            <Input label="From Date" type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
          </div>
          <div className="w-36">
            <Input label="To Date" type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setSymbol(''); setFromDate(''); setToDate(''); setPage(1); }}>
            Clear
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {['Symbol', 'Type', 'Entry Date', 'Exit Date', 'Entry ₹', 'Exit ₹', 'Qty', 'Gross P&L', 'Net P&L', 'P&L %', 'Days', 'Strategy'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(12)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded shimmer" /></td>
                    ))}
                  </tr>
                ))
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2" />
                    No closed trades yet
                  </td>
                </tr>
              ) : (
                trades.map((trade: any) => {
                  const pnl = Number(trade.netPnl ?? 0);
                  const isWin = pnl >= 0;
                  return (
                    <tr key={trade.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                            <span className="text-[9px] font-bold text-primary">{trade.symbol.slice(0, 2)}</span>
                          </div>
                          <span className="font-semibold text-foreground">{trade.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={trade.tradeType === 'LONG' ? 'info' : 'warning'}>{trade.tradeType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(trade.entryDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(trade.exitDate)}</td>
                      <td className="px-4 py-3 font-mono text-foreground">{formatCurrency(Number(trade.entryPrice))}</td>
                      <td className="px-4 py-3 font-mono text-foreground">{formatCurrency(Number(trade.exitPrice))}</td>
                      <td className="px-4 py-3 text-foreground">{trade.entryQuantity}</td>
                      <td className="px-4 py-3 font-mono">
                        <span className={isWin ? 'text-profit' : 'text-loss'}>
                          {formatCurrency(Number(trade.realizedPnl ?? 0))}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        <div className="flex items-center gap-1">
                          {isWin ? <TrendingUp className="w-3 h-3 text-profit" /> : <TrendingDown className="w-3 h-3 text-loss" />}
                          <span className={isWin ? 'text-profit' : 'text-loss'}>{formatCurrency(pnl)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className={isWin ? 'text-profit' : 'text-loss'}>
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} trades
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
