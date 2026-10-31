import { MarketAsset, Candle } from '../types/trading';

export const INITIAL_ASSETS: MarketAsset[] = [
  // Crypto
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin Spot',
    category: 'crypto',
    currency: 'USD',
    price: 68420.50,
    change24h: 2.45,
    high24h: 69150.00,
    low24h: 66800.00,
    volume24h: 28400192000,
    bid: 68418.00,
    ask: 68423.00,
    spread: 5.00,
    decimalPlaces: 2,
    instrumentType: 'spot',
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum Spot',
    category: 'crypto',
    currency: 'USD',
    price: 3524.80,
    change24h: 1.82,
    high24h: 3590.00,
    low24h: 3450.00,
    volume24h: 14200500000,
    bid: 3524.20,
    ask: 3525.40,
    spread: 1.20,
    decimalPlaces: 2,
    instrumentType: 'spot',
  },
  {
    symbol: 'SOL/USD',
    name: 'Solana Spot',
    category: 'crypto',
    currency: 'USD',
    price: 182.40,
    change24h: 4.15,
    high24h: 188.00,
    low24h: 174.50,
    volume24h: 4890000000,
    bid: 182.35,
    ask: 182.45,
    spread: 0.10,
    decimalPlaces: 2,
    instrumentType: 'spot',
  },
  {
    symbol: 'BNB/USD',
    name: 'BNB Spot',
    category: 'crypto',
    currency: 'USD',
    price: 592.10,
    change24h: -0.65,
    high24h: 602.00,
    low24h: 588.00,
    volume24h: 1120000000,
    bid: 592.00,
    ask: 592.20,
    spread: 0.20,
    decimalPlaces: 2,
    instrumentType: 'spot',
  },

  // US Stocks & ETFs
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    category: 'us_stocks',
    currency: 'USD',
    price: 138.65,
    change24h: 3.20,
    high24h: 141.20,
    low24h: 135.80,
    volume24h: 62000000,
    bid: 138.60,
    ask: 138.70,
    spread: 0.10,
    decimalPlaces: 2,
    instrumentType: 'stock',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'us_stocks',
    currency: 'USD',
    price: 232.40,
    change24h: 0.75,
    high24h: 234.10,
    low24h: 230.90,
    volume24h: 45000000,
    bid: 232.38,
    ask: 232.42,
    spread: 0.04,
    decimalPlaces: 2,
    instrumentType: 'stock',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    category: 'us_stocks',
    currency: 'USD',
    price: 428.15,
    change24h: -0.42,
    high24h: 431.50,
    low24h: 425.80,
    volume24h: 21000000,
    bid: 428.10,
    ask: 428.20,
    spread: 0.10,
    decimalPlaces: 2,
    instrumentType: 'stock',
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    category: 'us_stocks',
    currency: 'USD',
    price: 585.30,
    change24h: 0.48,
    high24h: 586.90,
    low24h: 583.20,
    volume24h: 58000000,
    bid: 585.28,
    ask: 585.32,
    spread: 0.04,
    decimalPlaces: 2,
    instrumentType: 'etf',
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust (Nasdaq)',
    category: 'us_stocks',
    currency: 'USD',
    price: 495.80,
    change24h: 0.88,
    high24h: 497.50,
    low24h: 492.10,
    volume24h: 36000000,
    bid: 495.75,
    ask: 495.85,
    spread: 0.10,
    decimalPlaces: 2,
    instrumentType: 'etf',
  },

  // European Market (EUR Denominated)
  {
    symbol: 'ASML.AS',
    name: 'ASML Holding N.V. (Ams)',
    category: 'european',
    currency: 'EUR',
    price: 845.20,
    change24h: 1.60,
    high24h: 852.00,
    low24h: 838.00,
    volume24h: 1800000,
    bid: 845.00,
    ask: 845.40,
    spread: 0.40,
    decimalPlaces: 2,
    instrumentType: 'stock',
  },
  {
    symbol: 'SAP.DE',
    name: 'SAP SE (XETRA)',
    category: 'european',
    currency: 'EUR',
    price: 215.60,
    change24h: 0.95,
    high24h: 217.40,
    low24h: 214.20,
    volume24h: 2400000,
    bid: 215.55,
    ask: 215.65,
    spread: 0.10,
    decimalPlaces: 2,
    instrumentType: 'stock',
  },
  {
    symbol: 'LVMH.PA',
    name: 'LVMH Moët Hennessy Louis V.',
    category: 'european',
    currency: 'EUR',
    price: 682.40,
    change24h: -1.15,
    high24h: 694.00,
    low24h: 679.00,
    volume24h: 980000,
    bid: 682.20,
    ask: 682.60,
    spread: 0.40,
    decimalPlaces: 2,
    instrumentType: 'stock',
  },

  // Forex
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'forex',
    currency: 'USD',
    price: 1.0854,
    change24h: 0.12,
    high24h: 1.0880,
    low24h: 1.0835,
    volume24h: 140000000000,
    bid: 1.0853,
    ask: 1.0855,
    spread: 0.0002,
    decimalPlaces: 4,
    instrumentType: 'forex',
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    category: 'forex',
    currency: 'USD',
    price: 1.2982,
    change24h: -0.25,
    high24h: 1.3020,
    low24h: 1.2960,
    volume24h: 85000000000,
    bid: 1.2980,
    ask: 1.2984,
    spread: 0.0004,
    decimalPlaces: 4,
    instrumentType: 'forex',
  },
  {
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    category: 'forex',
    currency: 'USD',
    price: 153.25,
    change24h: 0.38,
    high24h: 153.80,
    low24h: 152.70,
    volume24h: 92000000000,
    bid: 153.23,
    ask: 153.27,
    spread: 0.04,
    decimalPlaces: 2,
    instrumentType: 'forex',
  },
];

export const EUR_USD_RATE = 1.0854;

/**
 * Generates realistic candles for chart view
 */
export function generateCandlesForAsset(basePrice: number, count = 60, intervalMinutes = 60): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const stepMs = intervalMinutes * 60 * 1000;
  let price = basePrice * 0.95; // start slightly earlier

  for (let i = count; i >= 0; i--) {
    const timestamp = now - i * stepMs;
    // Walk price with mean-reverting trend
    const deltaPct = (Math.random() - 0.48) * 0.015;
    const open = price;
    const close = Number((open * (1 + deltaPct)).toFixed(4));
    const high = Number((Math.max(open, close) * (1 + Math.random() * 0.008)).toFixed(4));
    const low = Number((Math.min(open, close) * (1 - Math.random() * 0.008)).toFixed(4));
    const volume = Math.floor(10000 + Math.random() * 90000);

    candles.push({ timestamp, open, high, low, close, volume });
    price = close;
  }

  // Ensure last candle close equals current basePrice
  if (candles.length > 0) {
    candles[candles.length - 1].close = basePrice;
  }

  return candles;
}

/**
 * Simulates micro-market ticks
 */
export function simulateMarketTick(assets: MarketAsset[]): MarketAsset[] {
  return assets.map(asset => {
    // 30% chance of a micro-tick per cycle
    if (Math.random() > 0.4) return asset;

    const deltaPct = (Math.random() - 0.495) * 0.001; // +/- 0.05%
    const newPrice = Number((asset.price * (1 + deltaPct)).toFixed(asset.decimalPlaces));
    const spread = asset.spread;
    const bid = Number((newPrice - spread / 2).toFixed(asset.decimalPlaces));
    const ask = Number((newPrice + spread / 2).toFixed(asset.decimalPlaces));
    const high24h = Math.max(asset.high24h, newPrice);
    const low24h = Math.min(asset.low24h, newPrice);
    const change24h = Number((asset.change24h + deltaPct * 20).toFixed(2));

    return {
      ...asset,
      price: newPrice,
      bid,
      ask,
      high24h,
      low24h,
      change24h,
    };
  });
}

/**
 * Generates depth order book for an asset
 */
export function generateOrderBook(price: number, decimalPlaces = 2) {
  const bids: { price: number; amount: number; total: number }[] = [];
  const asks: { price: number; amount: number; total: number }[] = [];

  let cumBid = 0;
  let cumAsk = 0;

  for (let i = 1; i <= 6; i++) {
    const bidPrice = Number((price * (1 - 0.0008 * i)).toFixed(decimalPlaces));
    const bidAmount = Number((Math.random() * 2 + 0.5).toFixed(3));
    cumBid += bidAmount;
    bids.push({ price: bidPrice, amount: bidAmount, total: Number(cumBid.toFixed(3)) });

    const askPrice = Number((price * (1 + 0.0008 * i)).toFixed(decimalPlaces));
    const askAmount = Number((Math.random() * 2 + 0.5).toFixed(3));
    cumAsk += askAmount;
    asks.push({ price: askPrice, amount: askAmount, total: Number(cumAsk.toFixed(3)) });
  }

  return { bids, asks };
}

export const INITIAL_MARKET_ASSETS = INITIAL_ASSETS;
export const getCandlesForAsset = (symbol: string, count = 60) => {
  const asset = INITIAL_ASSETS.find(a => a.symbol === symbol);
  return generateCandlesForAsset(asset ? asset.price : 100, count);
};
export const simulatePriceTick = (asset: MarketAsset): MarketAsset => {
  return simulateMarketTick([asset])[0] || asset;
};
