import test from 'node:test';
import assert from 'node:assert/strict';
import { scanCandles } from './marketScanner';
import type { Candle } from '../types/trading';

const hour = 3_600_000;
const now = 1_800_000_000_000;
const first = now - 211 * hour;
function candles(): Candle[] {
  return Array.from({ length: 210 }, (_, i) => {
    const close = 100 + i * 0.15;
    return { timestamp: first + i * hour, open: close - 0.1,
      high: close + 0.3, low: close - 0.3, close, volume: 100 + (i === 209 ? 150 : 0) };
  });
}

test('scanner returns auditable read-only classification', () => {
  const result = scanCandles('BTCUSDT', candles(), now);
  assert.equal(result.symbol, 'BTCUSDT');
  assert.equal(result.timeframe, '1h');
  assert.equal(result.classification, 'WATCH_BULLISH');
  assert.ok(result.reasons.length >= 3);
  assert.ok(result.price > 0);
});

test('scanner rejects insufficient history', () => {
  assert.throws(() => scanCandles('BTCUSDT', candles().slice(0, 100), now), /insuficiente/);
});

test('scanner rejects invalid candles', () => {
  const rows = candles();
  rows[30].close = NaN;
  assert.throws(() => scanCandles('BTCUSDT', rows, now), /inválidos/);
});

test('scanner rejects stale history', () => {
  assert.throws(() => scanCandles('BTCUSDT', candles(), now + 12 * hour), /desatualizado/);
});

test('scanner ignores unfinished candle', () => {
  const rows = candles();
  rows.push({ timestamp: now - 10_000, open: 1, high: 1, low: 1, close: 1, volume: 999999 });
  const result = scanCandles('BTCUSDT', rows, now);
  assert.ok(result.price > 100);
});
