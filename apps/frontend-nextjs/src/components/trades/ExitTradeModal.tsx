'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, TrendingUp, TrendingDown, Calculator, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function ExitTradeModal({ trade, onClose, onSuccess }: {
  trade: any; onClose: () => void; onSuccess: () => void;
}) {
  const [exitPrice, setExitPrice] = useState('');
  const [exitNotes, setExitNotes] = useState('');

  const price      = parseFloat(exitPrice) || 0;
  const entryPrice = Number(trade.entryPrice);
  const qty        = trade.entryQuantity;
  const rawPnl     = (price - entryPrice) * qty;
  const pnlPct     = price > 0 ? ((price - entryPrice) / entryPrice) * 100 : 0;
  const brokerage  = price > 0 ? Math.abs(rawPnl) * 0.003 + price * qty * 0.001 : 0;
  const netPnl     = rawPnl - brokerage;
  const isProfit   = rawPnl >= 0;

  const { mutate: exitTrade, isPending } = useMutation({
    mutationFn: () => api.post(`/trades/${trade.id}/exit`, { exitPrice: price, exitNotes }) as any,
    onSuccess: (data: any) => {
      const netVal = data.summary?.netPnl;
      toast.success(
        netVal >= 0
          ? `Profit booked: ${formatCurrency(netVal)}`
          : `Loss booked: ${formatCurrency(netVal)}`,
      );
      onSuccess();
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to exit trade'),
  });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-bold text-foreground">Exit Trade — {trade.symbol}</p>
            <p className="text-[11px] text-muted-foreground">
              Entry {formatCurrency(entryPrice)} · {qty} shares · {trade.exchange ?? 'NSE'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Entry details strip */}
          <div className="flex gap-2">
            {[
              { label: 'Entry Price',  val: formatCurrency(entryPrice),              cls: 'text-foreground' },
              { label: 'Stop Loss',    val: formatCurrency(Number(trade.stopLoss)),   cls: 'text-loss' },
              { label: 'Target',       val: formatCurrency(Number(trade.target1)),    cls: 'text-profit' },
            ].map(({ label, val, cls }) => (
              <div key={label} className="flex-1 text-center p-2 bg-secondary/40 rounded-lg">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={cn('text-xs font-mono font-semibold mt-0.5', cls)}>{val}</p>
              </div>
            ))}
          </div>

          <Input
            label="Exit Price (₹)"
            type="number"
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
            placeholder={entryPrice.toFixed(2)}
            step="0.05"
            autoFocus
          />

          <Input
            label="Notes (optional)"
            value={exitNotes}
            onChange={(e) => setExitNotes(e.target.value)}
            placeholder="Target hit / Stop triggered / Reversal..."
          />

          {/* Live P&L preview */}
          {price > 0 && (
            <div className={cn(
              'p-4 rounded-xl border',
              isProfit ? 'bg-profit/5 border-profit/20' : 'bg-loss/5 border-loss/20',
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isProfit
                    ? <TrendingUp className="w-4 h-4 text-profit" />
                    : <TrendingDown className="w-4 h-4 text-loss" />}
                  <span className={cn('font-semibold text-sm', isProfit ? 'text-profit' : 'text-loss')}>
                    {isProfit ? '↑ Profitable Exit' : '↓ Loss Trade'}
                  </span>
                </div>
                <span className={cn('text-xl font-bold font-mono tabular-nums', isProfit ? 'text-profit' : 'text-loss')}>
                  {rawPnl >= 0 ? '+' : ''}{formatCurrency(rawPnl)}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'Gross P&L',           val: formatCurrency(rawPnl),     cls: isProfit ? 'text-profit' : 'text-loss' },
                  { label: 'Return %',             val: formatPercent(pnlPct),      cls: isProfit ? 'text-profit' : 'text-loss' },
                  { label: 'Est. Brokerage + Tax', val: `~${formatCurrency(brokerage)}`, cls: 'text-muted-foreground' },
                  { label: 'Net P&L (approx)',     val: formatCurrency(netPnl),     cls: isProfit ? 'text-profit font-bold' : 'text-loss font-bold' },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cn('font-mono tabular-nums', cls)}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!price && (
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Enter the exit price to see P&L preview
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant={isProfit ? 'success' : 'danger'}
            onClick={() => exitTrade()}
            isLoading={isPending}
            disabled={!price || price <= 0}
            className="flex-1"
          >
            <Calculator className="w-4 h-4" />
            Confirm Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
