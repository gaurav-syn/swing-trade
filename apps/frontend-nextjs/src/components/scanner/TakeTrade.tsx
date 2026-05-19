'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, TrendingUp, Shield, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatPercent } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface TakeTradeProps {
  result: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function TakeTrade({ result, onClose, onSuccess }: TakeTradeProps) {
  const [entryPrice, setEntryPrice] = useState(Number(result.suggestedEntry).toFixed(2));
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  const qty = parseInt(quantity) || 0;
  const price = parseFloat(entryPrice) || 0;
  const investedAmount = qty * price;
  const riskAmount = price > 0 && result.stopLoss
    ? Math.abs(price - Number(result.stopLoss)) * qty
    : 0;
  const targetAmount = price > 0 && result.target1
    ? Math.abs(Number(result.target1) - price) * qty
    : 0;

  const { mutate: createTrade, isPending } = useMutation({
    mutationFn: () =>
      api.post('/trades', {
        symbol: result.symbol,
        exchange: result.exchange ?? 'NSE',
        entryPrice: price,
        entryQuantity: qty,
        stopLoss: Number(result.stopLoss),
        target1: Number(result.target1),
        target2: result.target2 ? Number(result.target2) : undefined,
        scannerRunId: result.scannerRunId,
        confidenceScore: Number(result.confidenceScore),
        strategy: result.strategy,
        entryNotes: notes || undefined,
      }) as any,
    onSuccess: () => {
      toast.success(`Trade opened: ${result.symbol}`);
      onSuccess();
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to create trade'),
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground">Take Trade — {result.symbol}</h2>
            <p className="text-xs text-muted-foreground">{result.companyName} · NSE · {result.strategy}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Scanner recommendation */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-secondary/50 rounded-xl">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Entry</p>
              <p className="text-sm font-mono font-bold text-foreground">{formatCurrency(Number(result.suggestedEntry))}</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-[10px] text-muted-foreground">Stop Loss</p>
              <p className="text-sm font-mono font-bold text-loss">{formatCurrency(Number(result.stopLoss))}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Target</p>
              <p className="text-sm font-mono font-bold text-profit">{formatCurrency(Number(result.target1))}</p>
            </div>
          </div>

          {/* User input */}
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
              label="Quantity (shares)"
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
            placeholder="Entry reason..."
          />

          {/* Trade summary */}
          {qty > 0 && price > 0 && (
            <div className="space-y-2 p-3 bg-secondary/30 rounded-xl text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invested Amount</span>
                <span className="font-mono text-foreground">{formatCurrency(investedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3 text-loss" /> Max Risk
                </span>
                <span className="font-mono text-loss">{formatCurrency(riskAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3 text-profit" /> Target Profit
                </span>
                <span className="font-mono text-profit">{formatCurrency(targetAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Risk:Reward</span>
                <span className="font-mono text-blue-400 font-bold">1:{Number(result.riskRewardRatio).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-mono text-yellow-400">{Number(result.confidenceScore)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
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
