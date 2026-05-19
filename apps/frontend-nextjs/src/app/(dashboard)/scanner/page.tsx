'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Zap, TrendingUp, Shield, Target, Clock,
  BarChart2, ChevronRight, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TakeTrade } from '@/components/scanner/TakeTrade';
import { formatCurrency, formatPercent, getSignalColor, getScoreColor, cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ScannerPage() {
  const qc = useQueryClient();
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const { data: latestResults, isLoading: loadingResults } = useQuery({
    queryKey: ['scanner-latest'],
    queryFn: () => api.get('/scanner/results/latest') as any,
    refetchInterval: activeRunId ? 3000 : false,
  });

  const { data: runData } = useQuery({
    queryKey: ['scanner-run', activeRunId],
    queryFn: () => api.get(`/scanner/run/${activeRunId}`) as any,
    enabled: !!activeRunId,
    refetchInterval: (data: any) => (data?.status === 'RUNNING' ? 2000 : false),
    onSuccess: (data: any) => {
      if (data?.status === 'COMPLETED') {
        setActiveRunId(null);
        qc.invalidateQueries({ queryKey: ['scanner-latest'] });
        toast.success(`Scan complete! Found ${data.opportunitiesFound} opportunities`);
      }
    },
  } as any);

  const { mutate: startScan, isPending: scanning } = useMutation({
    mutationFn: () => api.post('/scanner/run', { minScore: 55, maxStocks: 80 }) as any,
    onSuccess: (data: any) => {
      setActiveRunId(data.scannerRunId);
      toast.success('Market scan started...');
    },
    onError: () => toast.error('Failed to start scan'),
  });

  const isRunning = runData?.status === 'RUNNING' || scanning;
  const results = latestResults?.results ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Stock Scanner</h1>
          <p className="text-sm text-muted-foreground">
            Multi-indicator NSE scanner · RSI · MACD · EMA · SuperTrend · Volume
          </p>
        </div>
        <Button onClick={() => startScan()} isLoading={isRunning} size="lg">
          <Zap className="w-4 h-4" />
          {isRunning ? 'Scanning Market...' : 'Run Scanner'}
        </Button>
      </div>

      {/* Scan progress */}
      {isRunning && (
        <Card className="border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-sm font-medium text-foreground">Scanning NSE stocks...</p>
              <p className="text-xs text-muted-foreground">
                Analyzing RSI, MACD, EMA20/50/200, SuperTrend, Bollinger Bands, Volume
              </p>
            </div>
            {runData && (
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">Scanned: {runData.totalScanned}</p>
                <p className="text-xs text-profit">Found: {runData.opportunitiesFound}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Last scan info */}
      {latestResults && !isRunning && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-profit" />
          Last scan: {latestResults.totalScanned} stocks scanned ·{' '}
          <span className="text-profit">{latestResults.opportunitiesFound} opportunities found</span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-400/90">
          Scanner results are based on technical analysis and probability scoring.
          These are NOT buy/sell recommendations. Always do your own research.
          Past performance does not guarantee future results. Realistic win rate: 55–65%.
        </p>
      </div>

      {/* Results grid */}
      {loadingResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-card border border-border rounded-xl shimmer" />)}
        </div>
      ) : results.length === 0 ? (
        <Card className="text-center py-16">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No scan results yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Run Scanner" to find opportunities</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((result: any) => (
            <ScannerResultCard
              key={result.id}
              result={result}
              onTakeTrade={() => setSelectedResult(result)}
            />
          ))}
        </div>
      )}

      {/* Take Trade Modal */}
      {selectedResult && (
        <TakeTrade
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
          onSuccess={() => {
            setSelectedResult(null);
            qc.invalidateQueries({ queryKey: ['active-trades'] });
            toast.success(`Trade opened: ${selectedResult.symbol}`);
          }}
        />
      )}
    </div>
  );
}

function ScannerResultCard({ result, onTakeTrade }: { result: any; onTakeTrade: () => void }) {
  const rr = Number(result.riskRewardRatio);
  const score = Number(result.confidenceScore);
  const change = Number(result.dayChangePercent ?? 0);

  return (
    <Card className="hover:border-primary/40 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{result.symbol.slice(0, 2)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-foreground">{result.symbol}</p>
              <Badge className={getSignalColor(result.signalStrength)}>
                {result.signalStrength?.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{result.companyName} · {result.sector}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn('text-2xl font-bold font-mono', getScoreColor(score))}>{score}</p>
          <p className="text-[10px] text-muted-foreground">Score /100</p>
        </div>
      </div>

      {/* Price row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Entry</p>
          <p className="text-xs font-mono font-semibold text-foreground">{formatCurrency(Number(result.suggestedEntry))}</p>
        </div>
        <div className="bg-loss/5 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Stop Loss</p>
          <p className="text-xs font-mono font-semibold text-loss">{formatCurrency(Number(result.stopLoss))}</p>
        </div>
        <div className="bg-profit/5 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Target</p>
          <p className="text-xs font-mono font-semibold text-profit">{formatCurrency(Number(result.target1))}</p>
        </div>
        <div className="bg-blue-500/5 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">R:R</p>
          <p className="text-xs font-mono font-semibold text-blue-400">{rr.toFixed(2)}x</p>
        </div>
      </div>

      {/* Indicator row */}
      <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground flex-wrap">
        {result.rsi && (
          <span className={cn('px-1.5 py-0.5 rounded', Number(result.rsi) > 50 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss')}>
            RSI {Number(result.rsi).toFixed(0)}
          </span>
        )}
        {result.superTrendDir && (
          <span className={cn('px-1.5 py-0.5 rounded', result.superTrendDir === 'UP' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss')}>
            ST {result.superTrendDir}
          </span>
        )}
        {result.patterns?.length > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
            {result.patterns[0]?.replace(/_/g, ' ')}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {result.suggestedHoldDays}d hold
        </span>
      </div>

      {/* Strategy */}
      {result.strategy && (
        <p className="text-xs text-muted-foreground mb-3 italic">{result.strategy}</p>
      )}

      {/* Score breakdown */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        {[
          { label: 'Trend', value: result.trendScore, max: 30 },
          { label: 'Momentum', value: result.momentumScore, max: 30 },
          { label: 'Volume', value: result.volumeScore, max: 20 },
          { label: 'Pattern', value: result.patternScore, max: 20 },
        ].map(({ label, value, max }) => (
          <div key={label}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-foreground">{Number(value ?? 0)}/{max}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1">
              <div
                className="bg-primary h-1 rounded-full"
                style={{ width: `${(Number(value ?? 0) / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onTakeTrade} variant="primary" size="sm" className="w-full">
        <TrendingUp className="w-3.5 h-3.5" />
        Take Trade
      </Button>
    </Card>
  );
}
