// =============================================================================
// Scoring Engine — Probability-based signal scoring (NOT guaranteed returns)
// Combines multiple indicators for a composite confidence score (0–100)
// Realistic target win rate: 55–65% with strong R:R management
// =============================================================================

import { IndicatorResult, OHLCV } from './indicators.engine';

export interface ScoreResult {
  confidenceScore: number;    // 0–100
  signalStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  trendScore: number;
  momentumScore: number;
  volumeScore: number;
  patternScore: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strategy: string;
  reasoning: string[];
}

export class ScoringEngine {

  static score(indicators: IndicatorResult, patterns: string[], candles: OHLCV[]): ScoreResult {
    const reasoning: string[] = [];
    let trendScore = 0;
    let momentumScore = 0;
    let volumeScore = 0;
    let patternScore = 0;
    let bullishSignals = 0;
    let bearishSignals = 0;

    const lastClose = candles[candles.length - 1]?.close ?? 0;

    // ── TREND SCORING (max 30 points) ────────────────────────────────────────
    if (indicators.ema20 && indicators.ema50) {
      if (lastClose > indicators.ema20 && lastClose > indicators.ema50) {
        trendScore += 15;
        bullishSignals++;
        reasoning.push('Price above EMA20 and EMA50 — bullish trend');
      } else if (lastClose < indicators.ema20 && lastClose < indicators.ema50) {
        bearishSignals++;
        reasoning.push('Price below EMA20 and EMA50 — bearish trend');
      }

      if (indicators.ema20 > indicators.ema50) {
        trendScore += 10;
        bullishSignals++;
        reasoning.push('EMA20 above EMA50 — golden cross zone');
      } else {
        bearishSignals++;
      }
    }

    if (indicators.ema200) {
      if (lastClose > indicators.ema200) {
        trendScore += 5;
        bullishSignals++;
        reasoning.push('Price above EMA200 — long-term uptrend');
      } else {
        bearishSignals++;
        reasoning.push('Price below EMA200 — long-term downtrend');
      }
    }

    if (indicators.superTrend) {
      if (indicators.superTrend.direction === 'UP') {
        trendScore += 10;
        bullishSignals++;
        reasoning.push('SuperTrend signal: UP');
      } else {
        bearishSignals++;
        reasoning.push('SuperTrend signal: DOWN');
      }
    }

    // ADX (trend strength — direction neutral)
    if (indicators.adx !== null) {
      if (indicators.adx > 25) {
        trendScore += 5;
        reasoning.push(`ADX ${indicators.adx.toFixed(1)} — strong trend`);
      } else if (indicators.adx < 20) {
        trendScore = Math.max(0, trendScore - 5);
        reasoning.push(`ADX ${indicators.adx.toFixed(1)} — weak/choppy trend`);
      }
    }

    trendScore = Math.min(30, trendScore);

    // ── MOMENTUM SCORING (max 30 points) ─────────────────────────────────────
    if (indicators.rsi !== null) {
      if (indicators.rsi >= 50 && indicators.rsi <= 70) {
        momentumScore += 15;
        bullishSignals++;
        reasoning.push(`RSI ${indicators.rsi.toFixed(1)} — bullish momentum (not overbought)`);
      } else if (indicators.rsi > 70) {
        momentumScore += 5;
        reasoning.push(`RSI ${indicators.rsi.toFixed(1)} — overbought, caution`);
      } else if (indicators.rsi >= 30 && indicators.rsi < 45) {
        momentumScore += 8;
        reasoning.push(`RSI ${indicators.rsi.toFixed(1)} — recovering from oversold`);
      } else if (indicators.rsi < 30) {
        bearishSignals++;
        reasoning.push(`RSI ${indicators.rsi.toFixed(1)} — oversold`);
      }
    }

    if (indicators.macd) {
      if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
        momentumScore += 10;
        bullishSignals++;
        reasoning.push('MACD bullish crossover — histogram positive');
      } else if (indicators.macd.histogram < 0) {
        bearishSignals++;
        reasoning.push('MACD bearish — histogram negative');
      }

      if (indicators.macd.macd > 0) {
        momentumScore += 5;
        reasoning.push('MACD above zero line');
      }
    }

    if (indicators.stochastic) {
      if (indicators.stochastic.k > indicators.stochastic.d && indicators.stochastic.k < 80) {
        momentumScore += 5;
        reasoning.push(`Stochastic bullish crossover K:${indicators.stochastic.k.toFixed(1)}`);
      }
    }

    momentumScore = Math.min(30, momentumScore);

    // ── VOLUME SCORING (max 20 points) ───────────────────────────────────────
    if (indicators.volumeRatio !== null) {
      if (indicators.volumeRatio >= 2.0) {
        volumeScore += 20;
        bullishSignals++;
        reasoning.push(`Volume breakout ${(indicators.volumeRatio * 100).toFixed(0)}% above avg`);
      } else if (indicators.volumeRatio >= 1.5) {
        volumeScore += 15;
        reasoning.push(`Above-average volume ${(indicators.volumeRatio * 100).toFixed(0)}% of avg`);
      } else if (indicators.volumeRatio >= 1.2) {
        volumeScore += 8;
        reasoning.push('Slight volume pickup');
      } else if (indicators.volumeRatio < 0.7) {
        volumeScore += 2;
        reasoning.push('Low volume — weak conviction');
      }
    }

    volumeScore = Math.min(20, volumeScore);

    // ── PATTERN SCORING (max 20 points) ──────────────────────────────────────
    const bullishPatterns = ['BULLISH_ENGULFING', 'MORNING_STAR', 'HAMMER', 'STRONG_BULLISH'];
    const bearishPatterns = ['BEARISH_ENGULFING', 'SHOOTING_STAR'];
    const neutralPatterns = ['INSIDE_BAR', 'DOJI'];

    for (const pattern of patterns) {
      if (bullishPatterns.includes(pattern)) {
        patternScore += 8;
        bullishSignals++;
        reasoning.push(`Bullish pattern: ${pattern.replace(/_/g, ' ')}`);
      } else if (bearishPatterns.includes(pattern)) {
        bearishSignals++;
        reasoning.push(`Bearish pattern: ${pattern.replace(/_/g, ' ')}`);
      } else if (neutralPatterns.includes(pattern)) {
        patternScore += 3;
        reasoning.push(`Neutral pattern: ${pattern.replace(/_/g, ' ')}`);
      }
    }

    // Bollinger Band squeeze breakout
    if (indicators.bollingerBands) {
      const { bandwidth } = indicators.bollingerBands;
      if (bandwidth < 5 && lastClose > indicators.bollingerBands.upper) {
        patternScore += 10;
        bullishSignals++;
        reasoning.push('Bollinger Band squeeze breakout above upper band');
      } else if (lastClose < indicators.bollingerBands.lower) {
        bearishSignals++;
        reasoning.push('Price below Bollinger lower band');
      }
    }

    patternScore = Math.min(20, patternScore);

    // ── COMPOSITE SCORE ───────────────────────────────────────────────────────
    let confidenceScore = trendScore + momentumScore + volumeScore + patternScore;

    // Penalise conflicting signals
    if (bearishSignals > bullishSignals) {
      confidenceScore = Math.max(0, confidenceScore - 15);
      reasoning.push('Conflicting signals detected — score reduced');
    }

    confidenceScore = Math.min(95, Math.max(5, confidenceScore));

    const direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
      bullishSignals > bearishSignals
        ? 'BULLISH'
        : bearishSignals > bullishSignals
          ? 'BEARISH'
          : 'NEUTRAL';

    const signalStrength =
      confidenceScore >= 75 ? 'VERY_STRONG'
        : confidenceScore >= 60 ? 'STRONG'
          : confidenceScore >= 45 ? 'MODERATE'
            : 'WEAK';

    const strategy = this.identifyStrategy(indicators, patterns, candles);

    return {
      confidenceScore: Math.round(confidenceScore),
      signalStrength,
      trendScore: Math.round(trendScore),
      momentumScore: Math.round(momentumScore),
      volumeScore: Math.round(volumeScore),
      patternScore: Math.round(patternScore),
      direction,
      strategy,
      reasoning,
    };
  }

  private static identifyStrategy(
    indicators: IndicatorResult,
    patterns: string[],
    candles: OHLCV[],
  ): string {
    const lastClose = candles[candles.length - 1]?.close;

    if (indicators.superTrend?.direction === 'UP' && indicators.macd?.histogram > 0) {
      return 'SuperTrend + MACD Momentum';
    }
    if (patterns.includes('BULLISH_ENGULFING') || patterns.includes('MORNING_STAR')) {
      return 'Reversal Pattern Breakout';
    }
    if (indicators.volumeRatio > 1.8 && lastClose > indicators.ema20) {
      return 'Volume Breakout';
    }
    if (indicators.ema20 > indicators.ema50 && indicators.rsi > 50 && indicators.rsi < 65) {
      return 'EMA Trend Continuation';
    }
    if (indicators.bollingerBands && indicators.bollingerBands.bandwidth < 5) {
      return 'Bollinger Squeeze Breakout';
    }
    return 'Multi-Indicator Confluence';
  }
}
