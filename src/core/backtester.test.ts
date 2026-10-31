import test from 'node:test';
import assert from 'node:assert/strict';
import { runBacktestSimulation } from './backtester';
import { BacktestParams } from '../types/trading';

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

  const result = runBacktestSimulation(params);

  assert.ok(result.equityCurve.length > 30);
  assert.ok(typeof result.metrics.cumulativeReturnPct === 'number');
  assert.ok(typeof result.metrics.maxDrawdownPct === 'number');
  assert.ok(result.metrics.maxDrawdownPct >= 0);
  assert.ok(typeof result.metrics.winRatePct === 'number');
  assert.ok(result.metrics.winRatePct >= 0 && result.metrics.winRatePct <= 100);
  assert.ok(result.benchmarkComparison.alphaPct !== undefined);
});
