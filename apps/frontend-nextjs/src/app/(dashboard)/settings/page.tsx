'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.get('/portfolio') as any,
  });

  const [risk, setRisk] = useState({
    riskPerTrade: String(portfolio?.riskPerTrade ?? 2),
    maxOpenTrades: String(portfolio?.maxOpenTrades ?? 5),
    maxPortfolioRisk: String(portfolio?.maxPortfolioRisk ?? 10),
    dailyLossLimit: String(portfolio?.dailyLossLimit ?? 3),
  });

  const { mutate: updateRisk, isPending } = useMutation({
    mutationFn: () => api.patch('/users/risk-settings', {
      riskPerTrade: Number(risk.riskPerTrade),
      maxOpenTrades: Number(risk.maxOpenTrades),
      maxPortfolioRisk: Number(risk.maxPortfolioRisk),
      dailyLossLimit: Number(risk.dailyLossLimit),
    }),
    onSuccess: () => {
      toast.success('Risk settings updated');
      qc.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRisk(r => ({ ...r, [k]: e.target.value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your portfolio and risk settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Risk Management</span></CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Input
            label="Risk Per Trade (%)"
            type="number"
            value={risk.riskPerTrade}
            onChange={set('riskPerTrade')}
            step="0.5"
            min="0.5"
            max="10"
            suffix="%"
          />
          <Input
            label="Max Open Trades"
            type="number"
            value={risk.maxOpenTrades}
            onChange={set('maxOpenTrades')}
            min="1"
            max="20"
          />
          <Input
            label="Max Portfolio Risk (%)"
            type="number"
            value={risk.maxPortfolioRisk}
            onChange={set('maxPortfolioRisk')}
            step="1"
            min="5"
            max="50"
          />
          <Input
            label="Daily Loss Limit (%)"
            type="number"
            value={risk.dailyLossLimit}
            onChange={set('dailyLossLimit')}
            step="0.5"
            min="1"
            max="10"
          />
        </div>
        <Button onClick={() => updateRisk()} isLoading={isPending} className="mt-4">
          Save Risk Settings
        </Button>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle><span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Portfolio</span></CardTitle>
        </CardHeader>
        <div className="text-sm space-y-2 text-muted-foreground">
          <p>Initial Capital: <span className="text-foreground font-mono">₹{Number(portfolio?.initialCapital ?? 0).toLocaleString('en-IN')}</span></p>
          <p>Current Capital: <span className="text-foreground font-mono">₹{Number(portfolio?.currentCapital ?? 0).toLocaleString('en-IN')}</span></p>
          <p>Available: <span className="text-profit font-mono">₹{Number(portfolio?.availableCapital ?? 0).toLocaleString('en-IN')}</span></p>
        </div>
      </Card>
    </div>
  );
}
