import test from 'node:test';
import assert from 'node:assert/strict';
import { runBacktestSimulation } from './backtester';
import { BacktestParams, Candle } from '../types/trading';

test('runBacktestSimulation calculates valid statistics and equity curve', () => {
  const params: BacktestParams = {
    symbol: 'BTC/USD',
    strategyId: 'trend_following',
    periodDays: 90,
    initialCapital: 10000,
    currency: 'USD',
    slippagePct: 0.05,
    commissionPerTradePct: 0.05,
    riskPerTradePct: 0.5,
  };

  const start = Date.UTC(2026, 0, 1);
  const candles: Candle[] = Array.from({ length: 120 }, (_, i) => {
    const open = 60000 + i * 25 + Math.sin(i / 5) * 800;
    const close = open + Math.sin(i / 3) * 180;
    return {
      timestamp: start + i * 86_400_000,
      open,
      high: Math.max(open, close) + 350,
      low: Math.min(open, close) - 350,
      close,
      volume: 1000 + i,
    };
  });

  const result = runBacktestSimulation(params, candles);

  assert.ok(result.equityCurve.length > 30);
  assert.ok(typeof result.metrics.cumulativeReturnPct === 'number');
  assert.ok(typeof result.metrics.maxDrawdownPct === 'number');
  assert.ok(result.metrics.maxDrawdownPct >= 0);
  assert.ok(typeof result.metrics.winRatePct === 'number');
  assert.ok(result.metrics.winRatePct >= 0 && result.metrics.winRatePct <= 100);
  assert.ok(result.benchmarkComparison.alphaPct !== undefined);
});
