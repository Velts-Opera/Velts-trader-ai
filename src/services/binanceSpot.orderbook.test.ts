import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBinanceOrderBook } from './binanceSpot';

test('parses valid Binance order book', () => {
  const result = parseBinanceOrderBook({
    lastUpdateId: 123,
    bids: [['100.00', '2.5'], ['99.90', '1']],
    asks: [['100.10', '1.25'], ['100.20', '3']],
  });
  assert.equal(result.lastUpdateId, 123);
  assert.equal(result.bids[0].price, 100);
  assert.equal(result.bids[0].quantity, 2.5);
  assert.equal(result.bids[0].notional, 250);
  assert.equal(result.asks[0].price, 100.1);
});

test('rejects crossed order book', () => {
  assert.throws(() => parseBinanceOrderBook({
    lastUpdateId: 123,
    bids: [['100.20', '1']],
    asks: [['100.10', '1']],
  }), /cruzado/);
});

test('rejects malformed levels', () => {
  assert.throws(() => parseBinanceOrderBook({
    lastUpdateId: 123,
    bids: [['100', '-1']],
    asks: [['101', '1']],
  }), /inconsistente/);
});

test('rejects empty book', () => {
  assert.throws(() => parseBinanceOrderBook({
    lastUpdateId: 123,
    bids: [],
    asks: [],
  }), /incompleto/);
});
