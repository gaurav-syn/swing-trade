// =============================================================================
// Trade Setup Engine — Calculates entry, stop loss, targets using ATR
// =============================================================================

import { OHLCV, IndicatorResult } from './indicators.engine';

export interface TradeSetup {
  suggestedEntry: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
  suggestedHoldDays: number;
  riskPercent: number;
  rewardPercent: number;
}

export class TradeSetupEngine {

  static calculate(
    candles: OHLCV[],
    indicators: IndicatorResult,
    direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
  ): TradeSetup {
    const last = candles[candles.length - 1];
    const currentPrice = last.close;
    const atr = indicators.atr ?? currentPrice * 0.02;

    if (direction === 'BULLISH') {
      // Entry: current price or slight breakout above recent high
      const recentHigh = Math.max(...candles.slice(-5).map(c => c.high));
      const suggestedEntry = Math.min(currentPrice * 1.001, recentHigh * 1.002);

      // Stop loss: 1.5× ATR below entry (or swing low)
      const recentLow = Math.min(...candles.slice(-10).map(c => c.low));
      const atrStop = suggestedEntry - 1.5 * atr;
      const stopLoss = Math.max(atrStop, recentLow * 0.995);

      // Targets: minimum 2:1 and 3:1 R:R
      const risk = suggestedEntry - stopLoss;
      const target1 = suggestedEntry + 2 * risk;
      const target2 = suggestedEntry + 3 * risk;

      const riskPercent = ((suggestedEntry - stopLoss) / suggestedEntry) * 100;
      const rewardPercent = ((target1 - suggestedEntry) / suggestedEntry) * 100;
      const riskRewardRatio = risk > 0 ? (target1 - suggestedEntry) / risk : 2;

      const suggestedHoldDays = this.estimateHoldDays(atr, currentPrice, indicators);

      return {
        suggestedEntry: this.round(suggestedEntry),
        stopLoss: this.round(stopLoss),
        target1: this.round(target1),
        target2: this.round(target2),
        riskRewardRatio: this.round(riskRewardRatio, 2),
        suggestedHoldDays,
        riskPercent: this.round(riskPercent, 2),
        rewardPercent: this.round(rewardPercent, 2),
      };
    }

    // Neutral — use current price with standard R:R
    const stopLoss = this.round(currentPrice - 1.5 * atr);
    const target1 = this.round(currentPrice + 3 * atr);
    const target2 = this.round(currentPrice + 4.5 * atr);
    const risk = currentPrice - stopLoss;
    const riskRewardRatio = risk > 0 ? (target1 - currentPrice) / risk : 2;

    return {
      suggestedEntry: this.round(currentPrice),
      stopLoss,
      target1,
      target2,
      riskRewardRatio: this.round(riskRewardRatio, 2),
      suggestedHoldDays: 5,
      riskPercent: this.round(((currentPrice - stopLoss) / currentPrice) * 100, 2),
      rewardPercent: this.round(((target1 - currentPrice) / currentPrice) * 100, 2),
    };
  }

  private static estimateHoldDays(
    atr: number,
    price: number,
    indicators: IndicatorResult,
  ): number {
    const atrPercent = (atr / price) * 100;
    if (atrPercent > 4) return 3;       // High volatility — short hold
    if (atrPercent > 2.5) return 5;
    if (atrPercent > 1.5) return 7;
    if (indicators.adx && indicators.adx > 30) return 10; // Strong trend
    return 7;
  }

  private static round(value: number, decimals = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}
