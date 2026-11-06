import test from 'node:test';
import assert from 'node:assert/strict';
import { runBacktestSimulation } from './backtester';
import type { BacktestParams, Candle } from '../types/trading';

const params: BacktestParams = {
  symbol: 'BTC/USD',
  strategyId: 'trend_following',
  periodDays: 120,
  initialCapital: 10000,
  currency: 'USD',
  slippagePct: 0.04,
  commissionPerTradePct: 0.05,
  riskPerTradePct: 0.5,
};

function realLikeCandles(count = 140): Candle[] {
  const start = Date.UTC(2026, 0, 1);
  return Array.from({ length: count }, (_, i) => {
    const base = 60000 + i * 35 + Math.sin(i / 5) * 1200;
    const open = base;
    const close = base + Math.sin(i / 3) * 250;
    return {
      timestamp: start + i * 86_400_000,
      open,
      high: Math.max(open, close) + 500,
      low: Math.min(open, close) - 500,
      close,
      volume: 1000 + i * 2,
    };
  });
}

test('backtest refuses synthetic/no history fallback', () => {
  assert.throws(() => runBacktestSimulation(params), /histórico real suficiente/);
});

test('backtest runs deterministically on supplied candles', () => {
  const candles = realLikeCandles();
  const a = runBacktestSimulation(params, candles);
  const b = runBacktestSimulation(params, candles);
  assert.deepEqual(a.metrics, b.metrics);
  assert.equal(a.walkForwardVerified, false);
  assert.ok(Number.isFinite(a.metrics.cumulativeReturnPct));
  assert.ok(a.equityCurve.length > 0);
});

test('backtest does not create impossible equity from exit accounting', () => {
  const result = runBacktestSimulation(params, realLikeCandles());
  assert.ok(result.equityCurve.every(point => Number.isFinite(point.equity) && point.equity >= 0));
  assert.ok(Math.abs(result.metrics.cumulativeReturnPct) < 1000);
});
