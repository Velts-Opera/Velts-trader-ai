import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands, calculateATR } from './indicators';
import { Candle } from '../types/trading';

test('calculateSMA returns correct average', () => {
  const data = [10, 20, 30, 40, 50];
  const sma3 = calculateSMA(data, 3);
  assert.equal(sma3, 40); // (30+40+50)/3 = 40
});

test('calculateEMA responds with valid weighted value', () => {
  const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const ema = calculateEMA(data, 5);
  assert.ok(ema > 15 && ema <= 20);
});

test('calculateRSI returns bounds between 0 and 100', () => {
  const upward = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  const rsiUp = calculateRSI(upward, 14);
  assert.ok(rsiUp > 70, `Expected RSI > 70 for uptrend, got ${rsiUp}`);

  const downward = [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
  const rsiDown = calculateRSI(downward, 14);
  assert.ok(rsiDown < 30, `Expected RSI < 30 for downtrend, got ${rsiDown}`);
});

test('calculateBollingerBands returns upper > middle > lower', () => {
  const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
  const bb = calculateBollingerBands(prices, 20, 2);
  assert.ok(bb.upper > bb.middle);
  assert.ok(bb.middle > bb.lower);
  assert.ok(bb.bandwidth > 0);
});

test('calculateATR calculates positive volatility', () => {
  const mockCandles: Candle[] = Array.from({ length: 20 }, (_, i) => ({
    timestamp: Date.now() + i * 60000,
    open: 100 + i,
    high: 105 + i,
    low: 98 + i,
    close: 102 + i,
    volume: 1000,
  }));
  const atr = calculateATR(mockCandles, 14);
  assert.ok(atr > 0);
});
