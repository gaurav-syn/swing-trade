'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
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

  const price = parseFloat(exitPrice) || 0;
  const entryPrice = Number(trade.entryPrice);
  const qty = trade.entryQuantity;
  const rawPnl = (price - entryPrice) * qty;
  const pnlPct = price > 0 ? ((price - entryPrice) / entryPrice) * 100 : 0;
  const isProfit = rawPnl >= 0;

  const { mutate: exitTrade, isPending, data: exitResult } = useMutation({
    mutationFn: () =>
      api.post(`/trades/${trade.id}/exit`, { exitPrice: price, exitNotes }) as any,
    onSuccess: (data: any) => {
      toast.success(
        data.summary?.netPnl >= 0
          ? `Profit booked: ${formatCurrency(data.summary.netPnl)}`
          : `Loss booked: ${formatCurrency(data.summary.netPnl)}`,
      );
      onSuccess();
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to exit trade'),
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground">Exit Trade — {trade.symbol}</h2>
            <p className="text-xs text-muted-foreground">
              Entry: {formatCurrency(entryPrice)} · Qty: {qty}
            </p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
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
            label="Exit Notes (optional)"
            value={exitNotes}
            onChange={(e) => setExitNotes(e.target.value)}
            placeholder="Target hit / Stop loss / Reversal..."
          />

          {/* Live P&L preview */}
          {price > 0 && (
            <div className={cn('p-4 rounded-xl border', isProfit ? 'bg-profit/5 border-profit/30' : 'bg-loss/5 border-loss/30')}>
              <div className="flex items-center gap-2 mb-3">
                {isProfit
                  ? <TrendingUp className="w-4 h-4 text-profit" />
                  : <TrendingDown className="w-4 h-4 text-loss" />}
                <span className={cn('font-semibold text-sm', isProfit ? 'text-profit' : 'text-loss')}>
                  {isProfit ? 'Profit Trade' : 'Loss Trade'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross P&L</span>
                  <span className={cn('font-mono font-bold', isProfit ? 'text-profit' : 'text-loss')}>
                    {formatCurrency(rawPnl)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P&L %</span>
                  <span className={cn('font-mono', isProfit ? 'text-profit' : 'text-loss')}>
                    {formatPercent(pnlPct)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Est. Brokerage + Tax</span>
                  <span className="font-mono">~{formatCurrency(Math.abs(rawPnl) * 0.003 + price * qty * 0.001)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
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
