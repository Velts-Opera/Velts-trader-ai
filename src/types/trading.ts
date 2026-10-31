export type MarketCategory = 'crypto' | 'us_stocks' | 'european' | 'forex';

export type Currency = 'USD' | 'EUR';

export interface MarketAsset {
  symbol: string;
  name: string;
  category: MarketCategory;
  currency: Currency;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  bid: number;
  ask: number;
  spread: number;
  decimalPlaces: number;
  instrumentType: 'spot' | 'stock' | 'etf' | 'forex';
  minOrderSize?: number;
}

export type OrderSide = 'BUY' | 'SELL';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LIMIT';

export type OrderState = 
  | 'CREATED'
  | 'VALIDATED'
  | 'SUBMITTED'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface OrderStateLog {
  state: OrderState;
  timestamp: number;
  message?: string;
}

export interface Order {
  id: string;
  clientOrderId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  targetPrice?: number;
  stopLossPrice: number; // Mandatory for risk safety
  takeProfitPrice?: number;
  executedPrice?: number;
  slippage: number;
  fee: number;
  state: OrderState;
  stateHistory: OrderStateLog[];
  currency: Currency;
  createdAt: number;
  updatedAt: number;
  rejectionReason?: string;
  strategyId?: string;
  isPaper: boolean;
}

export interface Position {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  realizedPnL: number;
  currency: Currency;
  openTimestamp: number;
  exposurePct: number;
  isPaper: boolean;
}

export interface RiskConfig {
  maxRiskPerTradePct: number;      // e.g. 0.5%
  dailyLossLimitPct: number;       // e.g. 2.0%
  weeklyLossLimitPct: number;      // e.g. 5.0%
  maxAssetExposurePct: number;     // e.g. 10.0%
  allowLeverage: boolean;          // strictly false in v1
  requireStopLoss: boolean;        // strictly true
  emergencyStopActivated: boolean; // Kill-switch
  prohibitAveragingDown: boolean;  // strictly true
}

export interface PortfolioSummary {
  totalEquityUSD: number;
  availableCashUSD: number;
  totalEquityEUR: number;
  availableCashEUR: number;
  activeCurrency: Currency;
  dailyPnLUSD: number;
  dailyPnLPct: number;
  weeklyPnLUSD: number;
  weeklyPnLPct: number;
  monthlyPnLUSD: number;
  monthlyPnLPct: number;
  openPositionsCount: number;
  isLive: boolean; // Must always start false (Paper trading)
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorSnapshot {
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    ema20: number;
    ema50: number;
    ema200: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  atr14: number;
  supportLevel: number;
  resistanceLevel: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export type AgentRole = 
  | 'TECHNICAL'
  | 'FUNDAMENTAL'
  | 'QUANTITATIVE'
  | 'RISK_MANAGER'
  | 'SUPERVISOR';

export interface AgentAnalysisReport {
  agentRole: AgentRole;
  agentName: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidencePct: number;
  summary: string;
  keyPoints: string[];
  metrics?: Record<string, string | number>;
  timestamp: number;
  riskClearance?: boolean; // For Risk Manager
}

export interface CommitteeDecision {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidenceScore: number; // 0 - 100
  targetPrice: number;
  recommendedStopLoss: number;
  recommendedTakeProfit: number;
  riskPassed: boolean;
  riskManagerComments: string;
  supervisorRationale: string;
  reports: AgentAnalysisReport[];
  timestamp: number;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  timeframe: string;
  winRateEstimated: number;
  sharpeEstimated: number;
  parameters: Record<string, number | string>;
}

export interface BacktestParams {
  symbol: string;
  strategyId: string;
  periodDays: number;
  initialCapital: number;
  currency: Currency;
  slippagePct: number;
  commissionPerTradePct: number;
  riskPerTradePct: number;
}

export interface BacktestTrade {
  id: string;
  entryDate: string;
  exitDate: string;
  side: OrderSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPct: number;
  exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'SIGNAL_EXIT';
}

export interface BacktestResult {
  params: BacktestParams;
  metrics: {
    cumulativeReturnPct: number;
    annualizedReturnPct: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdownPct: number;
    profitFactor: number;
    winRatePct: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    mathExpectancy: number;
    avgWin: number;
    avgLoss: number;
  };
  benchmarkComparison: {
    strategyReturnPct: number;
    buyAndHoldReturnPct: number;
    alphaPct: number;
  };
  equityCurve: { date: string; equity: number; drawdown: number }[];
  trades: BacktestTrade[];
  overfittingRisk: 'LOW' | 'MODERATE' | 'HIGH';
  walkForwardVerified: boolean;
}
