import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePositionSize, evaluateOrderRisk, DEFAULT_RISK_CONFIG } from './riskManager';
import { Order, Position } from '../types/trading';

test('calculatePositionSize enforces max 0.5% risk limit per trade', () => {
  const equity = 10000; // $10,000 equity
  const entryPrice = 100;
  const stopLoss = 95; // $5 risk per share
  // 0.5% of $10,000 is $50 max risk.
  // $50 / $5 = 10 shares.
  const qty = calculatePositionSize(equity, entryPrice, stopLoss, 0.5);
  assert.equal(qty, 10);
});

test('calculatePositionSize respects max 10% exposure ceiling', () => {
  const equity = 10000;
  const entryPrice = 100;
  const stopLoss = 99.9; // Tiny risk per share would otherwise suggest huge position
  const qty = calculatePositionSize(equity, entryPrice, stopLoss, 0.5);
  // Max exposure is 10% of $10,000 = $1,000. At $100/share, max qty is 10 shares.
  assert.equal(qty, 10);
});

test('evaluateOrderRisk rejects order when emergency stop is active', () => {
  const config = { ...DEFAULT_RISK_CONFIG, emergencyStopActivated: true };
  const mockOrder = {
    clientOrderId: 'test_1',
    symbol: 'BTC/USD',
    side: 'BUY' as const,
    type: 'MARKET' as const,
    quantity: 0.1,
    targetPrice: 65000,
    stopLossPrice: 63000,
    currency: 'USD' as const,
    isPaper: true,
  };

  const result = evaluateOrderRisk(mockOrder, 10000, 0, 0, [], config);
  assert.equal(result.isApproved, false);
  assert.ok(result.violations.some(v => v.includes('PARADA DE EMERGÊNCIA')));
});

test('evaluateOrderRisk enforces mandatory stop loss', () => {
  const mockOrder = {
    clientOrderId: 'test_2',
    symbol: 'BTC/USD',
    side: 'BUY' as const,
    type: 'MARKET' as const,
    quantity: 0.01,
    targetPrice: 65000,
    stopLossPrice: 0, // Missing stop loss
    currency: 'USD' as const,
    isPaper: true,
  };

  const result = evaluateOrderRisk(mockOrder, 10000, 0, 0, [], DEFAULT_RISK_CONFIG);
  assert.equal(result.isApproved, false);
  assert.ok(result.violations.some(v => v.includes('Stop-loss')));
});

test('evaluateOrderRisk blocks trading when daily loss limit is breached', () => {
  const mockOrder = {
    clientOrderId: 'test_3',
    symbol: 'BTC/USD',
    side: 'BUY' as const,
    type: 'MARKET' as const,
    quantity: 0.01,
    targetPrice: 65000,
    stopLossPrice: 64000,
    currency: 'USD' as const,
    isPaper: true,
  };

  // Equity 10000, daily loss -$250 (exceeds 2% = -$200)
  const result = evaluateOrderRisk(mockOrder, 10000, -250, -250, [], DEFAULT_RISK_CONFIG);
  assert.equal(result.isApproved, false);
  assert.ok(result.violations.some(v => v.includes('diária atingido')));
});
