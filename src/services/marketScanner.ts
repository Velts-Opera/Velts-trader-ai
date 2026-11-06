import type { Candle } from '../types/trading';
import { buildIndicatorSnapshot } from '../core/indicators';
import { BINANCE_SPOT_PAIRS, fetchSpotCandles } from './binanceSpot';

export interface ScanResult {
  symbol: string;
  timeframe: '1h';
  asOf: number;
  price: number;
  rsi14: number;
  ema20: number;
  ema50: number;
  macdHistogram: number;
  atrPct: number;
  volumeRatio: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  classification: 'WATCH_BULLISH' | 'WATCH_BEARISH' | 'NO_SETUP';
  reasons: string[];
}

/** Quantitative market screening only; informational, read-only, and non-executing. */
export function scanCandles(symbol: string, candles: Candle[], now = Date.now()): ScanResult {
  if (candles.length < 200) throw new Error('Histórico insuficiente: são necessários 200 candles.');
  const ordered = [...candles].sort((a, b) => a.timestamp - b.timestamp);
  if (ordered.some((c, i) => !Number.isFinite(c.timestamp) ||
    ![c.open, c.high, c.low, c.close, c.volume].every(Number.isFinite) ||
    c.open <= 0 || c.close <= 0 || c.low <= 0 || c.high < Math.max(c.open, c.close) ||
    c.low > Math.min(c.open, c.close) || c.volume < 0 ||
    (i > 0 && c.timestamp <= ordered[i - 1].timestamp))) {
    throw new Error('Candles inválidos para análise.');
  }
  // Ignore the still-forming last 1h candle; use only completed intervals.
  const complete = ordered.filter(c => c.timestamp + 3_600_000 <= now);
  if (complete.length < 199) throw new Error('Histórico fechado insuficiente.');
  const latest = complete[complete.length - 1];
  if (now - (latest.timestamp + 3_600_000) > 7_200_000) {
    throw new Error('Histórico desatualizado.');
  }
  const indicators = buildIndicatorSnapshot(complete);
  const previous20 = complete.slice(-21, -1);
  const baselineVolume = previous20.reduce((sum, c) => sum + c.volume, 0) / previous20.length;
  const volumeRatio = baselineVolume > 0 ? latest.volume / baselineVolume : 0;
  const atrPct = (indicators.atr14 / latest.close) * 100;
  const bullish = indicators.trend === 'BULLISH' && indicators.rsi14 >= 45 &&
    indicators.rsi14 <= 70 && volumeRatio >= 1.2 && atrPct > 0;
  const bearish = indicators.trend === 'BEARISH' && indicators.rsi14 >= 30 &&
    indicators.rsi14 <= 55 && volumeRatio >= 1.2 && atrPct > 0;
  const reasons = [
    `Tendência: ${indicators.trend}`,
    `RSI(14): ${indicators.rsi14.toFixed(2)}`,
    `Volume relativo (20): ${volumeRatio.toFixed(2)}x`,
    `ATR(14): ${atrPct.toFixed(2)}% do preço`,
  ];
  return {
    symbol, timeframe: '1h', asOf: latest.timestamp + 3_600_000,
    price: latest.close, rsi14: indicators.rsi14,
    ema20: indicators.movingAverages.ema20, ema50: indicators.movingAverages.ema50,
    macdHistogram: indicators.macd.histogram, atrPct: Number(atrPct.toFixed(3)),
    volumeRatio: Number(volumeRatio.toFixed(3)), trend: indicators.trend,
    classification: bullish ? 'WATCH_BULLISH' : bearish ? 'WATCH_BEARISH' : 'NO_SETUP',
    reasons,
  };
}

export async function scanBinanceSpot(): Promise<{ asOf: number; mode: 'READ_ONLY'; results: ScanResult[] }> {
  const asOf = Date.now();
  const results = await Promise.all(BINANCE_SPOT_PAIRS.map(async symbol => {
    const candles = await fetchSpotCandles(symbol, '1h', 210);
    return scanCandles(symbol, candles, asOf);
  }));
  return { asOf, mode: 'READ_ONLY', results };
}
