import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOrderRisk, DEFAULT_RISK_CONFIG } from './riskManager';

const order = {
  clientOrderId: 'safety-test', symbol: 'BTC/USD', side: 'BUY' as const,
  type: 'MARKET' as const, quantity: 0.01, targetPrice: 100,
  stopLossPrice: 99, currency: 'USD' as const, isPaper: true,
};

test('rejects NaN quantity', () => {
  assert.equal(evaluateOrderRisk({ ...order, quantity: NaN }, 20, 0, 0, []).isApproved, false);
});
test('rejects negative quantity', () => {
  assert.equal(evaluateOrderRisk({ ...order, quantity: -1 }, 20, 0, 0, []).isApproved, false);
});
test('rejects zero equity', () => {
  assert.equal(evaluateOrderRisk(order, 0, 0, 0, []).isApproved, false);
});
test('rejects excessive quantity', () => {
  assert.equal(evaluateOrderRisk({ ...order, quantity: 1 }, 20, 0, 0, []).isApproved, false);
});
test('rejects invalid risk configuration', () => {
  assert.equal(evaluateOrderRisk(order, 20, 0, 0, [], { ...DEFAULT_RISK_CONFIG, maxRiskPerTradePct: 0 }).isApproved, false);
});
