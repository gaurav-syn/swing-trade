'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, TrendingUp, Shield, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface TakeTradeProps {
  result: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function TakeTrade({ result, onClose, onSuccess }: TakeTradeProps) {
  const [entryPrice, setEntryPrice] = useState(Number(result.suggestedEntry).toFixed(2));
  const [quantity, setQuantity]     = useState('1');
  const [notes, setNotes]           = useState('');

  const qty  = parseInt(quantity) || 0;
  const price = parseFloat(entryPrice) || 0;
  const investedAmount = qty * price;
  const riskAmount     = price > 0 && result.stopLoss ? Math.abs(price - Number(result.stopLoss)) * qty : 0;
  const targetAmount   = price > 0 && result.target1  ? Math.abs(Number(result.target1) - price) * qty  : 0;
  const rr             = riskAmount > 0 ? (targetAmount / riskAmount) : 0;

  const { mutate: createTrade, isPending } = useMutation({
    mutationFn: () => api.post('/trades', {
      symbol: result.symbol,
      exchange: result.exchange ?? 'NSE',
      entryPrice: price,
      entryQuantity: qty,
      stopLoss:  Number(result.stopLoss),
      target1:   Number(result.target1),
      target2:   result.target2 ? Number(result.target2) : undefined,
      scannerRunId:    result.scannerRunId,
      confidenceScore: Number(result.confidenceScore),
      strategy:        result.strategy,
      entryNotes:      notes || undefined,
    }) as any,
    onSuccess: () => {
      toast.success(`Trade opened: ${result.symbol}`);
      onSuccess();
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to create trade'),
  });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 rounded-xl flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{result.symbol.slice(0, 2)}</span>
            </div>
            <div>
              <p className="font-bold text-foreground">Take Trade — {result.symbol}</p>
              <p className="text-[11px] text-muted-foreground">{result.companyName} · NSE</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Scanner recommendation */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Suggested Entry', val: formatCurrency(Number(result.suggestedEntry)), cls: 'text-foreground', bg: 'bg-secondary/60' },
              { label: 'Stop Loss',       val: formatCurrency(Number(result.stopLoss)),       cls: 'text-loss',       bg: 'bg-loss/8 border border-loss/15' },
              { label: 'Target',          val: formatCurrency(Number(result.target1)),        cls: 'text-profit',     bg: 'bg-profit/8 border border-profit/15' },
            ].map(({ label, val, cls, bg }) => (
              <div key={label} className={`text-center p-3 rounded-xl ${bg}`}>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={`text-sm font-bold font-mono mt-0.5 ${cls}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Confidence row */}
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Confidence Score</span>
                <span className="font-bold text-foreground">{result.confidenceScore}/100</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${result.confidenceScore}%` }} />
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Entry Price (₹)"
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              step="0.05"
              min="0.01"
            />
            <Input
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              step="1"
            />
          </div>

          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for entry..."
          />

          {/* Trade summary */}
          {qty > 0 && price > 0 && (
            <div className="space-y-2 p-3.5 bg-secondary/40 border border-border/50 rounded-xl text-xs">
              {[
                { icon: null, label: 'Invested Amount', val: formatCurrency(investedAmount), cls: 'text-foreground' },
                { icon: Shield, label: 'Max Risk',        val: formatCurrency(riskAmount),    cls: 'text-loss' },
                { icon: Target, label: 'Target Profit',   val: formatCurrency(targetAmount),  cls: 'text-profit' },
              ].map(({ icon: Icon, label, val, cls }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                  </span>
                  <span className={`font-mono font-semibold tabular-nums ${cls}`}>{val}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 mt-1">
                <span className="text-muted-foreground font-medium">Risk:Reward Ratio</span>
                <span className="font-mono font-bold text-blue-400 tabular-nums">1:{rr.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            onClick={() => createTrade()}
            isLoading={isPending}
            disabled={qty <= 0 || price <= 0}
            className="flex-1"
          >
            <TrendingUp className="w-4 h-4" />
            Confirm Trade
          </Button>
        </div>
      </div>
    </div>
  );
}
