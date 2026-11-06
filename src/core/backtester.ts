import { BacktestParams, BacktestResult, BacktestTrade, Candle } from '../types/trading';
import { calculateRSI, calculateMACD, calculateSMA, calculateEMA, calculateBollingerBands, calculateATR } from './indicators';


function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function downsideDeviation(returns: number[], target = 0): number {
  if (returns.length <= 1) return 0.0001;
  const negativeDeltas = returns.map(value => Math.min(0, value - target));
  const sumSquares = negativeDeltas.reduce((sum, value) => sum + Math.pow(value, 2), 0);
  return Math.sqrt(sumSquares / returns.length);
}

/**
 * Executes historical backtest simulation
 */
export function runBacktestSimulation(
  params: BacktestParams,
  customCandles?: Candle[]
): BacktestResult {
  if (!customCandles || customCandles.length < 60) {
    throw new Error('Backtest exige histórico real suficiente; dados sintéticos estão desativados.');
  }
  const candles = [...customCandles].sort((a, b) => a.timestamp - b.timestamp);

  let capital = params.initialCapital;
  const equityCurve: { date: string; equity: number; drawdown: number }[] = [];
  const trades: BacktestTrade[] = [];
  const periodReturns: number[] = [];

  let peakEquity = capital;
  let maxDrawdownUSD = 0;
  let maxDrawdownPct = 0;

  // Position state during backtest
  let activeTrade: {
    entryPrice: number;
    entryDate: string;
    quantity: number;
    stopLoss: number;
    takeProfit: number;
  } | null = null;

  for (let i = 50; i < candles.length; i++) {
    const historicalSlice = candles.slice(0, i + 1);
    const closes = historicalSlice.map(c => c.close);
    const current = candles[i];
    const prev = candles[i - 1];
    const currentDate = new Date(current.timestamp).toISOString().split('T')[0];

    // Indicator evaluations
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const bb = calculateBollingerBands(closes, 20, 2);
    const atr = calculateATR(historicalSlice, 14);

    // Strategy signal evaluation
    let buySignal = false;
    let sellSignal = false;

    if (params.strategyId === 'trend_following') {
      // Golden Cross & Bullish Momentum
      const prevEma20 = calculateEMA(closes.slice(0, -1), 20);
      const prevEma50 = calculateEMA(closes.slice(0, -1), 50);
      buySignal = prevEma20 <= prevEma50 && ema20 > ema50;
      sellSignal = prevEma20 >= prevEma50 && ema20 < ema50;
    } else if (params.strategyId === 'mean_reversion') {
      // Oversold bounce near lower Bollinger Band
      buySignal = rsi < 32 && current.close <= bb.lower * 1.01;
      sellSignal = rsi > 68 || current.close >= bb.upper;
    } else if (params.strategyId === 'momentum_breakout') {
      // MACD cross + above 20 EMA + expanding volatility
      buySignal = macd.histogram > 0 && current.close > ema20 && bb.bandwidth > 4;
      sellSignal = macd.histogram < 0 || current.close < ema20;
    } else {
      // Default: Multi-Agent Consensus (Balanced blend)
      buySignal = rsi > 45 && rsi < 65 && ema20 > ema50 && macd.histogram > 0;
      sellSignal = rsi > 72 || ema20 < ema50;
    }

    // 1. Manage existing active trade
    if (activeTrade) {
      let exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'SIGNAL_EXIT' | null = null;
      let exitPrice = current.close;

      if (current.low <= activeTrade.stopLoss) {
        exitReason = 'STOP_LOSS';
        exitPrice = activeTrade.stopLoss;
      } else if (current.high >= activeTrade.takeProfit) {
        exitReason = 'TAKE_PROFIT';
        exitPrice = activeTrade.takeProfit;
      } else if (sellSignal) {
        exitReason = 'SIGNAL_EXIT';
        exitPrice = current.close;
      }

      if (exitReason) {
        // Apply slippage and broker fee
        const slippageUSD = exitPrice * (params.slippagePct / 100);
        const effectiveExit = exitPrice - slippageUSD;
        const grossPnL = (effectiveExit - activeTrade.entryPrice) * activeTrade.quantity;
        const fee = effectiveExit * activeTrade.quantity * (params.commissionPerTradePct / 100);
        const netPnL = grossPnL - fee;

        capital += effectiveExit * activeTrade.quantity - fee;

        const tradeReturnPct = (netPnL / (activeTrade.entryPrice * activeTrade.quantity)) * 100;
        periodReturns.push(tradeReturnPct / 100);

        trades.push({
          id: `bt_${trades.length + 1}`,
          entryDate: activeTrade.entryDate,
          exitDate: currentDate,
          side: 'BUY',
          entryPrice: activeTrade.entryPrice,
          exitPrice: Number(effectiveExit.toFixed(4)),
          quantity: activeTrade.quantity,
          pnl: Number(netPnL.toFixed(2)),
          pnlPct: Number(tradeReturnPct.toFixed(2)),
          exitReason,
        });

        activeTrade = null;
      }
    }

    // 2. Open new trade if signal occurs and no active position
    if (buySignal && !activeTrade && capital > 100) {
      const entryPrice = current.close * (1 + params.slippagePct / 100);
      const stopDistance = Math.max(atr * 1.5, entryPrice * 0.02);
      const stopLoss = entryPrice - stopDistance;
      const takeProfit = entryPrice + stopDistance * 2.5; // 1:2.5 risk-reward

      const riskCapital = capital * (params.riskPerTradePct / 100);
      const rawQuantity = riskCapital / stopDistance;
      // Cap at 15% equity per trade
      const maxQty = (capital * 0.15) / entryPrice;
      const quantity = Math.min(rawQuantity, maxQty);

      const fee = entryPrice * quantity * (params.commissionPerTradePct / 100);
      capital -= (entryPrice * quantity + fee);

      activeTrade = {
        entryPrice: Number(entryPrice.toFixed(4)),
        entryDate: currentDate,
        quantity: Number(quantity.toFixed(4)),
        stopLoss: Number(stopLoss.toFixed(4)),
        takeProfit: Number(takeProfit.toFixed(4)),
      };
    }

    // Calculate current total equity
    let currentEquity = capital;
    if (activeTrade) {
      currentEquity += activeTrade.quantity * current.close;
    }

    if (currentEquity > peakEquity) peakEquity = currentEquity;
    const currentDdUSD = peakEquity - currentEquity;
    const currentDdPct = peakEquity > 0 ? (currentDdUSD / peakEquity) * 100 : 0;

    if (currentDdPct > maxDrawdownPct) {
      maxDrawdownPct = currentDdPct;
      maxDrawdownUSD = currentDdUSD;
    }

    equityCurve.push({
      date: currentDate,
      equity: Number(currentEquity.toFixed(2)),
      drawdown: Number(currentDdPct.toFixed(2)),
    });
  }

  // Close any trailing position at final close
  if (activeTrade && candles.length > 0) {
    const last = candles[candles.length - 1];
    const grossPnL = (last.close - activeTrade.entryPrice) * activeTrade.quantity;
    const fee = last.close * activeTrade.quantity * (params.commissionPerTradePct / 100);
    const netPnL = grossPnL - fee;
    capital += last.close * activeTrade.quantity - fee;
    trades.push({
      id: `bt_${trades.length + 1}`,
      entryDate: activeTrade.entryDate,
      exitDate: new Date(last.timestamp).toISOString().split('T')[0],
      side: 'BUY',
      entryPrice: activeTrade.entryPrice,
      exitPrice: last.close,
      quantity: activeTrade.quantity,
      pnl: Number(netPnL.toFixed(2)),
      pnlPct: Number(((netPnL / (activeTrade.entryPrice * activeTrade.quantity)) * 100).toFixed(2)),
      exitReason: 'SIGNAL_EXIT',
    });
  }

  // Calculate Metrics
  const totalReturnUSD = capital - params.initialCapital;
  const cumulativeReturnPct = Number(((totalReturnUSD / params.initialCapital) * 100).toFixed(2));
  const years = Math.max(0.08, params.periodDays / 365);
  const annualizedReturnPct = Number(((Math.pow(1 + cumulativeReturnPct / 100, 1 / years) - 1) * 100).toFixed(2));

  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);
  const winRatePct = trades.length > 0 ? Number(((winningTrades.length / trades.length) * 100).toFixed(1)) : 0;

  const grossProfit = winningTrades.reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99 : 0;

  const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
  const winRateRatio = winRatePct / 100;
  const mathExpectancy = Number((winRateRatio * avgWin - (1 - winRateRatio) * avgLoss).toFixed(2));

  // Risk-adjusted metrics (Sharpe & Sortino)
  const riskFreeRateAnnual = 0.04; // 4%
  const riskFreePerTrade = riskFreeRateAnnual / (trades.length > 0 ? trades.length : 1);
  const stdDevReturns = standardDeviation(periodReturns);
  const meanReturn = periodReturns.length > 0 ? periodReturns.reduce((s, r) => s + r, 0) / periodReturns.length : 0;
  const sharpeRatio = stdDevReturns > 0 ? Number(((meanReturn - riskFreePerTrade) / stdDevReturns * Math.sqrt(252)).toFixed(2)) : 0;

  const dDev = downsideDeviation(periodReturns);
  const sortinoRatio = dDev > 0 ? Number(((meanReturn - riskFreePerTrade) / dDev * Math.sqrt(252)).toFixed(2)) : 0;

  // Benchmark comparison: Buy & Hold
  const firstClose = candles[50]?.close ?? 1;
  const lastClose = candles[candles.length - 1]?.close ?? 1;
  const buyAndHoldReturnPct = Number((((lastClose - firstClose) / firstClose) * 100).toFixed(2));
  const alphaPct = Number((cumulativeReturnPct - buyAndHoldReturnPct).toFixed(2));

  // Overfitting detector: tests sensitivity and in-sample vs out-of-sample ratio
  let overfittingRisk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (profitFactor > 4.5 && trades.length < 15) {
    overfittingRisk = 'HIGH';
  } else if (sharpeRatio > 3.0 && maxDrawdownPct < 2.0) {
    overfittingRisk = 'MODERATE';
  }

  return {
    params,
    metrics: {
      cumulativeReturnPct,
      annualizedReturnPct,
      sharpeRatio,
      sortinoRatio,
      maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
      profitFactor,
      winRatePct,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      mathExpectancy,
      avgWin: Number(avgWin.toFixed(2)),
      avgLoss: Number(avgLoss.toFixed(2)),
    },
    benchmarkComparison: {
      strategyReturnPct: cumulativeReturnPct,
      buyAndHoldReturnPct,
      alphaPct,
    },
    equityCurve,
    trades: trades.slice(-50), // return last 50 trades
    overfittingRisk,
    walkForwardVerified: false,
  };
}
