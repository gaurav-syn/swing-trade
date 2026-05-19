// =============================================================================
// Technical Indicators Engine
// Pure TypeScript — no external TA library dependency in Phase 1
// All calculations follow standard formulas used by professional traders
// =============================================================================

export interface OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: Date;
}

export interface IndicatorResult {
  rsi: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  sma20: number | null;
  atr: number | null;
  superTrend: { value: number; direction: 'UP' | 'DOWN' } | null;
  bollingerBands: { upper: number; middle: number; lower: number; bandwidth: number } | null;
  volumeRatio: number | null;
  adx: number | null;
  stochastic: { k: number; d: number } | null;
}

export class IndicatorsEngine {

  // ─── EMA ───────────────────────────────────────────────────────────────────
  static ema(data: number[], period: number): number[] {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    const result: number[] = [];
    let emaVal = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(emaVal);
    for (let i = period; i < data.length; i++) {
      emaVal = data[i] * k + emaVal * (1 - k);
      result.push(emaVal);
    }
    return result;
  }

  // ─── SMA ───────────────────────────────────────────────────────────────────
  static sma(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  // ─── RSI ───────────────────────────────────────────────────────────────────
  static rsi(closes: number[], period = 14): number[] {
    if (closes.length < period + 1) return [];
    const changes = closes.slice(1).map((c, i) => c - closes[i]);
    let avgGain = changes.slice(0, period).filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
    let avgLoss = Math.abs(changes.slice(0, period).filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;
    const result: number[] = [];

    if (avgLoss === 0) {
      result.push(100);
    } else {
      result.push(100 - 100 / (1 + avgGain / avgLoss));
    }

    for (let i = period; i < changes.length; i++) {
      const gain = changes[i] > 0 ? changes[i] : 0;
      const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      if (avgLoss === 0) {
        result.push(100);
      } else {
        result.push(100 - 100 / (1 + avgGain / avgLoss));
      }
    }
    return result;
  }

  // ─── MACD ──────────────────────────────────────────────────────────────────
  static macd(
    closes: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9,
  ): { macd: number; signal: number; histogram: number }[] {
    const fastEma = this.ema(closes, fastPeriod);
    const slowEma = this.ema(closes, slowPeriod);
    const offset = slowPeriod - fastPeriod;
    const macdLine = fastEma.slice(offset).map((v, i) => v - slowEma[i]);
    const signalLine = this.ema(macdLine, signalPeriod);
    const sigOffset = macdLine.length - signalLine.length;

    return signalLine.map((sig, i) => ({
      macd: macdLine[sigOffset + i],
      signal: sig,
      histogram: macdLine[sigOffset + i] - sig,
    }));
  }

  // ─── ATR ───────────────────────────────────────────────────────────────────
  static atr(candles: OHLCV[], period = 14): number[] {
    if (candles.length < period + 1) return [];
    const trueRanges = candles.slice(1).map((c, i) => {
      const prev = candles[i];
      return Math.max(
        c.high - c.low,
        Math.abs(c.high - prev.close),
        Math.abs(c.low - prev.close),
      );
    });
    const result: number[] = [];
    let atrVal = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(atrVal);
    for (let i = period; i < trueRanges.length; i++) {
      atrVal = (atrVal * (period - 1) + trueRanges[i]) / period;
      result.push(atrVal);
    }
    return result;
  }

  // ─── SUPERTREND ────────────────────────────────────────────────────────────
  static superTrend(
    candles: OHLCV[],
    period = 10,
    multiplier = 3,
  ): { value: number; direction: 'UP' | 'DOWN' }[] {
    const atrs = this.atr(candles, period);
    const offset = candles.length - atrs.length;
    const result: { value: number; direction: 'UP' | 'DOWN' }[] = [];

    let prevSuperTrend = 0;
    let prevDir: 'UP' | 'DOWN' = 'UP';

    for (let i = 0; i < atrs.length; i++) {
      const idx = offset + i;
      const hl2 = (candles[idx].high + candles[idx].low) / 2;
      const upperBand = hl2 + multiplier * atrs[i];
      const lowerBand = hl2 - multiplier * atrs[i];
      const close = candles[idx].close;

      let direction: 'UP' | 'DOWN';
      let stValue: number;

      if (i === 0) {
        direction = close > hl2 ? 'UP' : 'DOWN';
        stValue = direction === 'UP' ? lowerBand : upperBand;
      } else {
        if (prevDir === 'UP') {
          stValue = Math.max(lowerBand, prevSuperTrend);
          direction = close >= stValue ? 'UP' : 'DOWN';
        } else {
          stValue = Math.min(upperBand, prevSuperTrend);
          direction = close <= stValue ? 'DOWN' : 'UP';
        }
      }

      prevSuperTrend = stValue;
      prevDir = direction;
      result.push({ value: stValue, direction });
    }
    return result;
  }

  // ─── BOLLINGER BANDS ───────────────────────────────────────────────────────
  static bollingerBands(
    closes: number[],
    period = 20,
    stdDevMultiplier = 2,
  ): { upper: number; middle: number; lower: number; bandwidth: number }[] {
    const result: { upper: number; middle: number; lower: number; bandwidth: number }[] = [];
    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1);
      const middle = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      const upper = middle + stdDevMultiplier * stdDev;
      const lower = middle - stdDevMultiplier * stdDev;
      const bandwidth = ((upper - lower) / middle) * 100;
      result.push({ upper, middle, lower, bandwidth });
    }
    return result;
  }

  // ─── ADX ───────────────────────────────────────────────────────────────────
  static adx(candles: OHLCV[], period = 14): number[] {
    if (candles.length < period * 2) return [];
    const dmPlus: number[] = [];
    const dmMinus: number[] = [];
    const trs: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      const curr = candles[i];
      const prev = candles[i - 1];
      const upMove = curr.high - prev.high;
      const downMove = prev.low - curr.low;
      dmPlus.push(upMove > downMove && upMove > 0 ? upMove : 0);
      dmMinus.push(downMove > upMove && downMove > 0 ? downMove : 0);
      trs.push(Math.max(curr.high - curr.low, Math.abs(curr.high - prev.close), Math.abs(curr.low - prev.close)));
    }

    const smoothDmPlus = this.ema(dmPlus, period);
    const smoothDmMinus = this.ema(dmMinus, period);
    const smoothTr = this.ema(trs, period);

    const dx = smoothTr.map((tr, i) => {
      const diPlus = tr === 0 ? 0 : (smoothDmPlus[i] / tr) * 100;
      const diMinus = tr === 0 ? 0 : (smoothDmMinus[i] / tr) * 100;
      const sum = diPlus + diMinus;
      return sum === 0 ? 0 : (Math.abs(diPlus - diMinus) / sum) * 100;
    });

    return this.ema(dx, period);
  }

  // ─── STOCHASTIC ────────────────────────────────────────────────────────────
  static stochastic(
    candles: OHLCV[],
    kPeriod = 14,
    dPeriod = 3,
  ): { k: number; d: number }[] {
    const kValues: number[] = [];
    for (let i = kPeriod - 1; i < candles.length; i++) {
      const slice = candles.slice(i - kPeriod + 1, i + 1);
      const highestHigh = Math.max(...slice.map(c => c.high));
      const lowestLow = Math.min(...slice.map(c => c.low));
      const range = highestHigh - lowestLow;
      kValues.push(range === 0 ? 50 : ((candles[i].close - lowestLow) / range) * 100);
    }
    const dValues = this.sma(kValues, dPeriod);
    const offset = kValues.length - dValues.length;
    return dValues.map((d, i) => ({ k: kValues[offset + i], d }));
  }

  // ─── VOLUME RATIO ──────────────────────────────────────────────────────────
  static volumeRatio(volumes: number[], period = 20): number[] {
    const smaVol = this.sma(volumes, period);
    const offset = volumes.length - smaVol.length;
    return smaVol.map((avg, i) => (avg === 0 ? 1 : volumes[offset + i] / avg));
  }

  // ─── CANDLESTICK PATTERNS ──────────────────────────────────────────────────
  static detectPatterns(candles: OHLCV[]): string[] {
    if (candles.length < 3) return [];
    const patterns: string[] = [];
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const prev2 = candles[candles.length - 3];

    const body = Math.abs(last.close - last.open);
    const range = last.high - last.low;
    const upperShadow = last.high - Math.max(last.open, last.close);
    const lowerShadow = Math.min(last.open, last.close) - last.low;

    // Doji
    if (range > 0 && body / range < 0.1) patterns.push('DOJI');

    // Hammer
    if (body > 0 && lowerShadow >= 2 * body && upperShadow <= 0.1 * body) {
      patterns.push('HAMMER');
    }

    // Shooting Star
    if (body > 0 && upperShadow >= 2 * body && lowerShadow <= 0.1 * body) {
      patterns.push('SHOOTING_STAR');
    }

    // Bullish Engulfing
    if (
      prev.close < prev.open &&
      last.close > last.open &&
      last.open < prev.close &&
      last.close > prev.open
    ) {
      patterns.push('BULLISH_ENGULFING');
    }

    // Bearish Engulfing
    if (
      prev.close > prev.open &&
      last.close < last.open &&
      last.open > prev.close &&
      last.close < prev.open
    ) {
      patterns.push('BEARISH_ENGULFING');
    }

    // Morning Star
    if (
      prev2.close < prev2.open &&
      Math.abs(prev.close - prev.open) < (prev2.open - prev2.close) * 0.3 &&
      last.close > last.open &&
      last.close > (prev2.open + prev2.close) / 2
    ) {
      patterns.push('MORNING_STAR');
    }

    // Inside Bar
    if (last.high < prev.high && last.low > prev.low) {
      patterns.push('INSIDE_BAR');
    }

    // Strong bullish candle
    if (last.close > last.open && body / range > 0.7 && last.close > prev.close) {
      patterns.push('STRONG_BULLISH');
    }

    return patterns;
  }

  // ─── SUPPORT / RESISTANCE ──────────────────────────────────────────────────
  static findSupportResistance(
    candles: OHLCV[],
    lookback = 20,
  ): { support: number; resistance: number } {
    const recent = candles.slice(-lookback);
    const highs = recent.map(c => c.high);
    const lows = recent.map(c => c.low);
    return {
      support: Math.min(...lows),
      resistance: Math.max(...highs),
    };
  }

  // ─── COMPUTE ALL ───────────────────────────────────────────────────────────
  static compute(candles: OHLCV[]): IndicatorResult {
    if (candles.length < 30) {
      return {
        rsi: null, macd: null, ema20: null, ema50: null,
        ema200: null, sma20: null, atr: null, superTrend: null,
        bollingerBands: null, volumeRatio: null, adx: null, stochastic: null,
      };
    }

    const closes = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);

    const rsiVals = this.rsi(closes, 14);
    const macdVals = this.macd(closes, 12, 26, 9);
    const ema20Vals = this.ema(closes, 20);
    const ema50Vals = this.ema(closes, 50);
    const ema200Vals = closes.length >= 200 ? this.ema(closes, 200) : [];
    const sma20Vals = this.sma(closes, 20);
    const atrVals = this.atr(candles, 14);
    const stVals = this.superTrend(candles, 10, 3);
    const bbVals = this.bollingerBands(closes, 20, 2);
    const volRatioVals = this.volumeRatio(volumes, 20);
    const adxVals = this.adx(candles, 14);
    const stochVals = this.stochastic(candles, 14, 3);

    return {
      rsi: rsiVals.length ? rsiVals[rsiVals.length - 1] : null,
      macd: macdVals.length ? macdVals[macdVals.length - 1] : null,
      ema20: ema20Vals.length ? ema20Vals[ema20Vals.length - 1] : null,
      ema50: ema50Vals.length ? ema50Vals[ema50Vals.length - 1] : null,
      ema200: ema200Vals.length ? ema200Vals[ema200Vals.length - 1] : null,
      sma20: sma20Vals.length ? sma20Vals[sma20Vals.length - 1] : null,
      atr: atrVals.length ? atrVals[atrVals.length - 1] : null,
      superTrend: stVals.length ? stVals[stVals.length - 1] : null,
      bollingerBands: bbVals.length ? bbVals[bbVals.length - 1] : null,
      volumeRatio: volRatioVals.length ? volRatioVals[volRatioVals.length - 1] : null,
      adx: adxVals.length ? adxVals[adxVals.length - 1] : null,
      stochastic: stochVals.length ? stochVals[stochVals.length - 1] : null,
    };
  }
}
