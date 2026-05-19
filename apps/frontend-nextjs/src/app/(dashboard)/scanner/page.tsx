'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Zap, TrendingUp, Shield, Target, Clock,
  AlertCircle, CheckCircle2, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TakeTrade } from '@/components/scanner/TakeTrade';
import { formatCurrency, getSignalColor, getScoreColor, cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ScannerPage() {
  const qc = useQueryClient();
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [activeRunId, setActiveRunId]        = useState<string | null>(null);

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
  const results   = latestResults?.results ?? [];

  const progress = isRunning && runData
    ? Math.round((runData.totalScanned / 80) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Stock Scanner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Multi-indicator NSE scanner · RSI · MACD · EMA20/50/200 · SuperTrend · Volume
          </p>
        </div>
        <Button
          onClick={() => startScan()}
          isLoading={isRunning}
          size="lg"
          className="shrink-0"
        >
          <Zap className="w-4 h-4" />
          {isRunning ? 'Scanning...' : 'Run Scanner'}
        </Button>
      </div>

      {/* Scan progress */}
      {isRunning && (
        <Card className="border-primary/30 bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Scanning NSE stocks...</p>
              <div className="mt-2 w-full bg-secondary rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {runData?.totalScanned ?? 0}/80 scanned ·{' '}
                <span className="text-profit">{runData?.opportunitiesFound ?? 0} opportunities found</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Last scan info */}
      {latestResults && !isRunning && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-profit" />
            <span>{latestResults.totalScanned} stocks scanned</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <span className="text-xs text-profit font-medium">{latestResults.opportunitiesFound} opportunities found</span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 p-3.5 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-400/80 leading-relaxed">
          Scanner results are based on technical analysis and probability scoring.
          These are <strong>NOT</strong> buy/sell recommendations. Always do your own research.
          Realistic win rate: 55–65%. Past performance does not guarantee future results.
        </p>
      </div>

      {/* Results */}
      {loadingResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-56 bg-card border border-border rounded-xl shimmer" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">No scan results yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Click "Run Scanner" to find trading opportunities</p>
          <Button onClick={() => startScan()} isLoading={isRunning} size="sm">
            <Zap className="w-3.5 h-3.5" /> Start Scan
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((result: any) => (
            <ScannerResultCard key={result.id} result={result} onTakeTrade={() => setSelectedResult(result)} />
          ))}
        </div>
      )}

      {selectedResult && (
        <TakeTrade
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
          onSuccess={() => {
            setSelectedResult(null);
            qc.invalidateQueries({ queryKey: ['active-trades'] });
          }}
        />
      )}
    </div>
  );
}

function ScannerResultCard({ result, onTakeTrade }: { result: any; onTakeTrade: () => void }) {
  const score  = Number(result.confidenceScore);
  const change = Number(result.dayChangePercent ?? 0);

  const scoreColor =
    score >= 75 ? 'text-emerald-400' :
    score >= 60 ? 'text-blue-400' :
    score >= 45 ? 'text-yellow-400' : 'text-red-400';

  const scoreBg =
    score >= 75 ? 'bg-emerald-500/10 border-emerald-500/20' :
    score >= 60 ? 'bg-blue-500/10 border-blue-500/20' :
    score >= 45 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

  const signalClass: Record<string, string> = {
    VERY_STRONG: 'signal-very-strong',
    STRONG:      'signal-strong',
    MODERATE:    'signal-moderate',
    WEAK:        'signal-weak',
  };

  return (
    <Card className="card-hover-glow transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 rounded-xl flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{result.symbol.slice(0, 2)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground text-[15px]">{result.symbol}</span>
              <span className={cn(
                'text-[11px] font-semibold px-2 py-0.5 rounded-md',
                signalClass[result.signalStrength] ?? 'bg-secondary text-muted-foreground',
              )}>
                {result.signalStrength?.replace('_', ' ')}
              </span>
              <span className={cn(
                'text-[11px] font-medium',
                change >= 0 ? 'text-profit' : 'text-loss',
              )}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
              {result.companyName} · {result.sector}
            </p>
          </div>
        </div>

        {/* Score */}
        <div className={cn('text-center px-3 py-2 rounded-xl border', scoreBg)}>
          <p className={cn('text-2xl font-bold font-mono leading-none', scoreColor)}>{score}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">Score</p>
        </div>
      </div>

      {/* Price grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Entry',     val: formatCurrency(Number(result.suggestedEntry)), cls: 'text-foreground', bg: 'bg-secondary/60' },
          { label: 'Stop Loss', val: formatCurrency(Number(result.stopLoss)),       cls: 'text-loss',       bg: 'bg-loss/8' },
          { label: 'Target',    val: formatCurrency(Number(result.target1)),        cls: 'text-profit',     bg: 'bg-profit/8' },
          { label: 'R:R',       val: `${Number(result.riskRewardRatio).toFixed(1)}x`, cls: 'text-blue-400', bg: 'bg-blue-500/8' },
        ].map(({ label, val, cls, bg }) => (
          <div key={label} className={cn('rounded-lg p-2 text-center', bg)}>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={cn('text-xs font-mono font-bold mt-0.5', cls)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Indicator tags */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {result.rsi && (
          <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium',
            Number(result.rsi) > 50 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss',
          )}>
            RSI {Number(result.rsi).toFixed(0)}
          </span>
        )}
        {result.superTrendDir && (
          <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium',
            result.superTrendDir === 'UP' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss',
          )}>
            ST {result.superTrendDir}
          </span>
        )}
        {result.patterns?.slice(0, 2).map((p: string) => (
          <span key={p} className="px-2 py-0.5 rounded text-[11px] bg-purple-500/10 text-purple-400">
            {p.replace(/_/g, ' ')}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />{result.suggestedHoldDays}d hold
        </span>
      </div>

      {/* Score sub-bars */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Trend',    value: result.trendScore,    max: 30 },
          { label: 'Momentum', value: result.momentumScore, max: 30 },
          { label: 'Volume',   value: result.volumeScore,   max: 20 },
          { label: 'Pattern',  value: result.patternScore,  max: 20 },
        ].map(({ label, value, max }) => (
          <div key={label}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-foreground tabular-nums">{Number(value ?? 0)}</span>
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

      {result.strategy && (
        <p className="text-[11px] text-muted-foreground/70 italic mb-3 truncate">{result.strategy}</p>
      )}

      <Button onClick={onTakeTrade} variant="primary" size="sm" className="w-full">
        <TrendingUp className="w-3.5 h-3.5" />
        Take This Trade
        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
      </Button>
    </Card>
  );
}
