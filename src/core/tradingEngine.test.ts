import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionState, processOrderExecution, PaperAccount } from './tradingEngine';
import { DEFAULT_RISK_CONFIG } from './riskManager';

test('canTransitionState adheres to order state graph', () => {
  assert.equal(canTransitionState('CREATED', 'VALIDATED'), true);
  assert.equal(canTransitionState('VALIDATED', 'SUBMITTED'), true);
  assert.equal(canTransitionState('SUBMITTED', 'FILLED'), true);
  assert.equal(canTransitionState('FILLED', 'CREATED'), false); // Cannot revert from terminal
  assert.equal(canTransitionState('REJECTED', 'SUBMITTED'), false);
});

test('processOrderExecution executes paper BUY order and creates open position', () => {
  const initialAccount: PaperAccount = {
    equityUSD: 10000,
    cashUSD: 10000,
    equityEUR: 9216.59,
    cashEUR: 9216.59,
    activeCurrency: 'USD',
    eurUsdRate: 1.085,
    positions: [],
    orders: [],
    executedTradesCount: 0,
    dailyRealizedPnL: 0,
    weeklyRealizedPnL: 0,
  };

  const orderInput = {
    symbol: 'NVDA',
    side: 'BUY' as const,
    type: 'MARKET' as const,
    quantity: 5,
    targetPrice: 120,
    stopLossPrice: 110,
    currency: 'USD' as const,
  };

  const result = processOrderExecution(orderInput, initialAccount, 0.04, DEFAULT_RISK_CONFIG);

  assert.equal(result.execution.order.state, 'FILLED');
  assert.ok(result.execution.order.executedPrice! >= 120);
  assert.ok(result.execution.order.fee > 0);
  assert.equal(result.account.positions.length, 1);
  assert.equal(result.account.positions[0].symbol, 'NVDA');
  assert.equal(result.account.positions[0].quantity, 5);
  assert.ok(result.account.cashUSD < 10000);
});

test('processOrderExecution rejects order if risk check fails', () => {
  const initialAccount: PaperAccount = {
    equityUSD: 10000,
    cashUSD: 10000,
    equityEUR: 9216.59,
    cashEUR: 9216.59,
    activeCurrency: 'USD',
    eurUsdRate: 1.085,
    positions: [],
    orders: [],
    executedTradesCount: 0,
    dailyRealizedPnL: 0,
    weeklyRealizedPnL: 0,
  };

  // Missing stop loss
  const orderInput = {
    symbol: 'BTC/USD',
    side: 'BUY' as const,
    type: 'MARKET' as const,
    quantity: 0.1,
    targetPrice: 65000,
    stopLossPrice: 0,
    currency: 'USD' as const,
  };

  const result = processOrderExecution(orderInput, initialAccount, 0.5, DEFAULT_RISK_CONFIG);
  assert.equal(result.execution.order.state, 'REJECTED');
  assert.equal(result.account.positions.length, 0);
  assert.ok(result.execution.error);
});


test('paper equity includes open position market value after BUY', () => {
  const initial: PaperAccount = {
    equityUSD: 10000, cashUSD: 10000, equityEUR: 9216.59, cashEUR: 9216.59,
    activeCurrency: 'USD', eurUsdRate: 1.085, positions: [], orders: [],
    executedTradesCount: 0, dailyRealizedPnL: 0, weeklyRealizedPnL: 0,
  };
  const opened = processOrderExecution({
    symbol: 'BTC/USD', side: 'BUY', type: 'MARKET', quantity: 0.01,
    targetPrice: 1000, stopLossPrice: 950, currency: 'USD',
  }, initial, 0.1, DEFAULT_RISK_CONFIG).account;

  assert.equal(opened.positions.length, 1);
  assert.ok(opened.equityUSD > 9900 && opened.equityUSD <= 10000);
});

test('closing paper position settles proceeds once and does not duplicate PnL', () => {
  const initial: PaperAccount = {
    equityUSD: 10000, cashUSD: 10000, equityEUR: 9216.59, cashEUR: 9216.59,
    activeCurrency: 'USD', eurUsdRate: 1.085, positions: [], orders: [],
    executedTradesCount: 0, dailyRealizedPnL: 0, weeklyRealizedPnL: 0,
  };
  const opened = processOrderExecution({
    symbol: 'BTC/USD', side: 'BUY', type: 'MARKET', quantity: 0.01,
    targetPrice: 1000, stopLossPrice: 950, currency: 'USD',
  }, initial, 0.1, DEFAULT_RISK_CONFIG).account;

  const closed = processOrderExecution({
    symbol: 'BTC/USD', side: 'SELL', type: 'MARKET', quantity: 0.01,
    targetPrice: 1300, stopLossPrice: 1400, currency: 'USD',
  }, opened, 0.1, DEFAULT_RISK_CONFIG).account;

  assert.equal(closed.positions.length, 0);
  assert.ok(closed.cashUSD > initial.cashUSD);
  assert.ok(closed.cashUSD < 10150);
  assert.equal(closed.equityUSD, closed.cashUSD);
});
