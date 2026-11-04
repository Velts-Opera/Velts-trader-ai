import type { Candle, MarketAsset } from '../types/trading';

export const BINANCE_SPOT_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'] as const;
export type BinancePair = (typeof BINANCE_SPOT_PAIRS)[number];
export type BinanceInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
  bidPrice: string;
  askPrice: string;
  closeTime: number;
};

const BASE_URL = 'https://api.binance.com';
const MAX_STALENESS_MS = 120_000;

export function validatePair(value: string): BinancePair {
  if (!BINANCE_SPOT_PAIRS.includes(value as BinancePair)) {
    throw new Error('Par de negociação não autorizado');
  }
  return value as BinancePair;
}

export function validateInterval(value: string): BinanceInterval {
  if (!['1m', '5m', '15m', '1h', '4h', '1d'].includes(value)) {
    throw new Error('Intervalo de candles não autorizado');
  }
  return value as BinanceInterval;
}

export function parseBinanceTicker(data: unknown, now = Date.now()): Pick<MarketAsset,
  'price' | 'change24h' | 'high24h' | 'low24h' | 'volume24h' | 'bid' | 'ask' | 'spread'> {
  if (!data || typeof data !== 'object') throw new Error('Resposta da Binance inválida');
  const value = data as BinanceTicker;
  const numbers = [
    value.lastPrice, value.priceChangePercent, value.highPrice, value.lowPrice,
    value.quoteVolume, value.bidPrice, value.askPrice,
  ].map(Number);
  const [price, change24h, high24h, low24h, volume24h, bid, ask] = numbers;
  if (!numbers.every(Number.isFinite) || price <= 0 || high24h <= 0 || low24h <= 0 ||
      bid <= 0 || ask <= 0 || ask < bid || volume24h < 0 ||
      !Number.isFinite(value.closeTime) || value.closeTime > now + 60_000 ||
      now - value.closeTime > MAX_STALENESS_MS) {
    throw new Error('Cotação Binance inválida ou desatualizada');
  }
  return { price, change24h, high24h, low24h, volume24h, bid, ask, spread: ask - bid };
}

export function parseBinanceCandles(data: unknown): Candle[] {
  if (!Array.isArray(data)) throw new Error('Candles Binance inválidos');
  return data.map((row: unknown): Candle => {
    if (!Array.isArray(row) || row.length < 6) throw new Error('Candle Binance incompleto');
    const timestamp = Number(row[0]);
    const [open, high, low, close, volume] = row.slice(1, 6).map(Number);
    if (![timestamp, open, high, low, close, volume].every(Number.isFinite) ||
      open <= 0 || high <= 0 || low <= 0 || close <= 0 || volume < 0 ||
      high < Math.max(open, close) || low > Math.min(open, close)) {
      throw new Error('Candle Binance inconsistente');
    }
    return { timestamp, open, high, low, close, volume };
  });
}

async function getJson(endpoint: string, params: URLSearchParams): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(`${BASE_URL}${endpoint}?${params}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Binance HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSpotQuotes(): Promise<Record<BinancePair, ReturnType<typeof parseBinanceTicker>>> {
  const entries = await Promise.all(BINANCE_SPOT_PAIRS.map(async symbol => {
    const raw = await getJson('/api/v3/ticker/24hr', new URLSearchParams({ symbol }));
    if (!raw || typeof raw !== 'object' || (raw as { symbol?: string }).symbol !== symbol) {
      throw new Error('Símbolo de cotação divergente');
    }
    return [symbol, parseBinanceTicker(raw)] as const;
  }));
  return Object.fromEntries(entries) as Record<BinancePair, ReturnType<typeof parseBinanceTicker>>;
}

export async function fetchSpotCandles(symbol: BinancePair, interval: BinanceInterval, limit = 200): Promise<Candle[]> {
  if (!Number.isInteger(limit) || limit < 2 || limit > 500) throw new Error('Limite de candles inválido');
  return parseBinanceCandles(await getJson('/api/v3/klines', new URLSearchParams({
    symbol, interval, limit: String(limit),
  })));
}
