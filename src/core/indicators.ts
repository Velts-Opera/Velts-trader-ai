import { Candle, IndicatorSnapshot } from '../types/trading';

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number {
  if (data.length < period || period <= 0) return data[data.length - 1] ?? 0;
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return Number((sum / period).toFixed(4));
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number {
  if (data.length === 0 || period <= 0) return 0;
  if (data.length < period) return calculateSMA(data, data.length);

  const k = 2 / (period + 1);
  let ema = calculateSMA(data.slice(0, period), period);

  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }

  return Number(ema.toFixed(4));
}

/**
 * Calculates Relative Strength Index (RSI - 14 standard)
 */
export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Number(rsi.toFixed(2));
}

/**
 * Calculates MACD (Fast = 12, Slow = 26, Signal = 9)
 */
export function calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9) {
  if (closes.length < slow) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }

  const fastEMA = calculateEMA(closes, fast);
  const slowEMA = calculateEMA(closes, slow);
  const macdLine = Number((fastEMA - slowEMA).toFixed(4));

  // Build a series of MACD points for the signal line
  const macdSeries: number[] = [];
  const startIdx = Math.max(slow, closes.length - (signal + 5));
  for (let i = startIdx; i <= closes.length; i++) {
    const subCloses = closes.slice(0, i);
    const f = calculateEMA(subCloses, fast);
    const s = calculateEMA(subCloses, slow);
    macdSeries.push(f - s);
  }

  const signalLine = Number(calculateEMA(macdSeries, signal).toFixed(4));
  const histogram = Number((macdLine - signalLine).toFixed(4));

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Bollinger Bands (Period = 20, StdDev = 2)
 */
export function calculateBollingerBands(closes: number[], period = 20, multiplier = 2) {
  if (closes.length < period) {
    const last = closes[closes.length - 1] ?? 0;
    return { upper: last, middle: last, lower: last, bandwidth: 0 };
  }

  const slice = closes.slice(-period);
  const middle = calculateSMA(slice, period);

  const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = Number((middle + multiplier * stdDev).toFixed(4));
  const lower = Number((middle - multiplier * stdDev).toFixed(4));
  const bandwidth = middle > 0 ? Number((((upper - lower) / middle) * 100).toFixed(2)) : 0;

  return { upper, middle, lower, bandwidth };
}

/**
 * Calculates Average True Range (ATR - 14)
 */
export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) {
    const avg = trueRanges.reduce((acc, v) => acc + v, 0) / trueRanges.length;
    return Number(avg.toFixed(4));
  }

  return Number(calculateSMA(trueRanges, period).toFixed(4));
}

/**
 * Computes Support & Resistance from high/low pivots
 */
export function calculateSupportResistance(candles: Candle[]) {
  if (candles.length === 0) return { supportLevel: 0, resistanceLevel: 0 };
  const slice = candles.slice(-30);
  let min = slice[0].low;
  let max = slice[0].high;

  for (const c of slice) {
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }

  return {
    supportLevel: Number(min.toFixed(4)),
    resistanceLevel: Number(max.toFixed(4)),
  };
}

/**
 * Builds complete indicator snapshot
 */
export function buildIndicatorSnapshot(candles: Candle[]): IndicatorSnapshot {
  const closes = candles.map(c => c.close);
  const currentClose = closes[closes.length - 1] ?? 0;

  const rsi14 = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, Math.min(200, closes.length));
  const bollingerBands = calculateBollingerBands(closes, 20, 2);
  const atr14 = calculateATR(candles, 14);
  const { supportLevel, resistanceLevel } = calculateSupportResistance(candles);

  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (currentClose > ema50 && ema20 > ema50 && macd.histogram > 0) {
    trend = 'BULLISH';
  } else if (currentClose < ema50 && ema20 < ema50 && macd.histogram < 0) {
    trend = 'BEARISH';
  }

  return {
    rsi14,
    macd,
    movingAverages: {
      sma20,
      sma50,
      ema20,
      ema50,
      ema200,
    },
    bollingerBands,
    atr14,
    supportLevel,
    resistanceLevel,
    trend,
  };
}
