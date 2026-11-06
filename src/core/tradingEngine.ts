import { Order, OrderSide, OrderType, OrderState, Position, RiskConfig, Currency } from '../types/trading';
import { evaluateOrderRisk, DEFAULT_RISK_CONFIG } from './riskManager';

export interface ExecutionResult {
  order: Order;
  position?: Position;
  closedPositionId?: string;
  realizedPnL?: number;
  error?: string;
}

export interface PaperAccount {
  equityUSD: number;
  cashUSD: number;
  equityEUR: number;
  cashEUR: number;
  activeCurrency: Currency;
  eurUsdRate: number; // e.g. 1.085
  positions: Position[];
  orders: Order[];
  executedTradesCount: number;
  dailyRealizedPnL: number;
  weeklyRealizedPnL: number;
}

/**
 * Valid order state transitions graph
 */
const VALID_TRANSITIONS: Record<OrderState, OrderState[]> = {
  CREATED: ['VALIDATED', 'REJECTED', 'CANCELLED'],
  VALIDATED: ['SUBMITTED', 'REJECTED', 'CANCELLED'],
  SUBMITTED: ['PARTIALLY_FILLED', 'FILLED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  PARTIALLY_FILLED: ['FILLED', 'CANCELLED', 'EXPIRED'],
  FILLED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
};

/**
 * Validates if an order state transition is legal
 */
export function canTransitionState(from: OrderState, to: OrderState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Simulates realistic slippage based on market liquidity and spread
 */
export function calculateSimulatedSlippage(price: number, spread: number, side: OrderSide): number {
  // Base slippage is half the spread plus a tiny dynamic market impact (0.01% - 0.04%)
  const spreadSlippage = spread / 2;
  const impactPct = 0.0002; // 0.02%
  const impactUSD = price * impactPct;
  const totalSlippage = spreadSlippage + impactUSD;
  return Number(totalSlippage.toFixed(4));
}

/**
 * Simulates broker fee (0.05% or $1 minimum)
 */
export function calculateSimulatedFee(price: number, quantity: number): number {
  const tradeValue = price * quantity;
  const feePct = 0.0005; // 0.05%
  const fee = Math.max(1.0, tradeValue * feePct);
  return Number(fee.toFixed(2));
}

/**
 * Advances order through state machine with transition logging
 */
export function transitionOrderState(order: Order, newState: OrderState, message?: string): Order {
  if (!canTransitionState(order.state, newState)) {
    throw new Error(`Invalid state transition from ${order.state} to ${newState}`);
  }

  const updatedHistory = [
    ...order.stateHistory,
    { state: newState, timestamp: Date.now(), message },
  ];

  return {
    ...order,
    state: newState,
    stateHistory: updatedHistory,
    updatedAt: Date.now(),
  };
}

/**
 * Creates and executes an order in the Paper Trading simulator
 */
export function processOrderExecution(
  orderInput: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    targetPrice: number;
    stopLossPrice: number;
    takeProfitPrice?: number;
    currency?: Currency;
    strategyId?: string;
  },
  account: PaperAccount,
  marketSpread: number = 0.05,
  riskConfig: RiskConfig = DEFAULT_RISK_CONFIG
): { account: PaperAccount; execution: ExecutionResult } {
  const currency = orderInput.currency ?? account.activeCurrency;
  const clientOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Check for Duplicate Orders (Idempotency)
  const isDuplicate = account.orders.some(
    o => o.symbol === orderInput.symbol && 
         o.side === orderInput.side && 
         Math.abs(o.createdAt - Date.now()) < 1000 &&
         o.state !== 'REJECTED' && o.state !== 'CANCELLED'
  );

  let order: Order = {
    id: `ord_${Math.random().toString(36).substring(2, 9)}`,
    clientOrderId,
    symbol: orderInput.symbol,
    side: orderInput.side,
    type: orderInput.type,
    quantity: orderInput.quantity,
    targetPrice: orderInput.targetPrice,
    stopLossPrice: orderInput.stopLossPrice,
    takeProfitPrice: orderInput.takeProfitPrice,
    slippage: 0,
    fee: 0,
    state: 'CREATED',
    stateHistory: [{ state: 'CREATED', timestamp: Date.now(), message: 'Order created' }],
    currency,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    strategyId: orderInput.strategyId,
    isPaper: true,
  };

  if (isDuplicate) {
    order = transitionOrderState(order, 'REJECTED', 'Erro de duplicidade: Ordem idêntica detectada em menos de 1s.');
    order.rejectionReason = 'Ordem duplicada bloqueada pelo motor';
    return {
      account: { ...account, orders: [order, ...account.orders] },
      execution: { order, error: order.rejectionReason },
    };
  }

  // 2. Risk Manager Pre-Flight Evaluation
  const riskEval = evaluateOrderRisk(
    {
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      targetPrice: order.targetPrice,
      stopLossPrice: order.stopLossPrice,
      takeProfitPrice: order.takeProfitPrice,
      currency: order.currency,
      strategyId: order.strategyId,
      isPaper: true,
    },
    account.equityUSD,
    account.dailyRealizedPnL,
    account.weeklyRealizedPnL,
    account.positions,
    riskConfig
  );

  if (!riskEval.isApproved) {
    order = transitionOrderState(order, 'REJECTED', `Rejeitado pelo Gerenciador de Risco: ${riskEval.rejectionReason}`);
    order.rejectionReason = riskEval.rejectionReason;
    return {
      account: { ...account, orders: [order, ...account.orders] },
      execution: { order, error: order.rejectionReason },
    };
  }

  // Order validated by Risk Gate
  order = transitionOrderState(order, 'VALIDATED', 'Risco e parâmetros validados com sucesso');

  // Check sufficient cash for BUY orders
  const slippagePerUnit = calculateSimulatedSlippage(orderInput.targetPrice, marketSpread, orderInput.side);
  const executedPrice = orderInput.side === 'BUY'
    ? Number((orderInput.targetPrice + slippagePerUnit).toFixed(4))
    : Number((orderInput.targetPrice - slippagePerUnit).toFixed(4));

  const fee = calculateSimulatedFee(executedPrice, orderInput.quantity);
  const totalCost = executedPrice * orderInput.quantity + fee;

  const currentAvailableCash = currency === 'USD' ? account.cashUSD : account.cashEUR;
  if (orderInput.side === 'BUY' && totalCost > currentAvailableCash) {
    order = transitionOrderState(order, 'REJECTED', 'Saldo disponível insuficiente para cobrir ordem e taxas simuladas.');
    order.rejectionReason = 'Saldo insuficiente';
    return {
      account: { ...account, orders: [order, ...account.orders] },
      execution: { order, error: order.rejectionReason },
    };
  }

  // 3. Submit to simulated broker exchange
  order = transitionOrderState(order, 'SUBMITTED', 'Enviado para a corretora virtual');

  // 4. Fill execution
  order.slippage = Number((slippagePerUnit * orderInput.quantity).toFixed(4));
  order.fee = fee;
  order.executedPrice = executedPrice;

  order = transitionOrderState(order, 'FILLED', `Executado a ${executedPrice} com slippage $${order.slippage} e taxa $${fee}`);

  // 5. Update Account Balances and Positions
  let updatedPositions = [...account.positions];
  let newCashUSD = account.cashUSD;
  let newCashEUR = account.cashEUR;
  let realizedPnL = 0;
  let closedPosId: string | undefined;

  // Check if closing existing opposing position
  const existingPosIdx = updatedPositions.findIndex(
    p => p.symbol === order.symbol && p.side !== order.side
  );

  if (existingPosIdx >= 0) {
    // Closing or reversing
    const pos = updatedPositions[existingPosIdx];
    closedPosId = pos.id;
    if (order.side === 'SELL') {
      // Selling long position
      realizedPnL = (executedPrice - pos.entryPrice) * pos.quantity - fee;
    } else {
      // Covering short position
      realizedPnL = (pos.entryPrice - executedPrice) * pos.quantity - fee;
    }

    if (currency === 'USD') {
      newCashUSD += (executedPrice * pos.quantity) - fee;
    } else {
      newCashEUR += (executedPrice * pos.quantity) - (fee / account.eurUsdRate);
    }
    updatedPositions.splice(existingPosIdx, 1);
  } else {
    // Opening new position
    if (order.side === 'BUY') {
      if (currency === 'USD') newCashUSD -= totalCost;
      else newCashEUR -= totalCost;

      const newPosition: Position = {
        id: `pos_${Math.random().toString(36).substring(2, 9)}`,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        entryPrice: executedPrice,
        currentPrice: executedPrice,
        stopLossPrice: order.stopLossPrice,
        takeProfitPrice: order.takeProfitPrice,
        unrealizedPnL: -fee,
        unrealizedPnLPct: Number(((-fee / (executedPrice * order.quantity)) * 100).toFixed(2)),
        realizedPnL: 0,
        currency,
        openTimestamp: Date.now(),
        exposurePct: Number(((executedPrice * order.quantity) / account.equityUSD * 100).toFixed(2)),
        isPaper: true,
      };

      updatedPositions.push(newPosition);
    }
  }

  // Recalculate total equity
  const openPositionValueUSD = updatedPositions.reduce((acc, p) => {
    const value = p.currentPrice * p.quantity;
    return acc + (p.currency === 'EUR' ? value * account.eurUsdRate : value);
  }, 0);
  const updatedEquityUSD = newCashUSD + openPositionValueUSD;
  const updatedEquityEUR = updatedEquityUSD / account.eurUsdRate;

  const updatedAccount: PaperAccount = {
    ...account,
    cashUSD: Number(newCashUSD.toFixed(2)),
    cashEUR: Number(newCashEUR.toFixed(2)),
    equityUSD: Number(updatedEquityUSD.toFixed(2)),
    equityEUR: Number(updatedEquityEUR.toFixed(2)),
    positions: updatedPositions,
    orders: [order, ...account.orders],
    executedTradesCount: account.executedTradesCount + 1,
    dailyRealizedPnL: Number((account.dailyRealizedPnL + realizedPnL).toFixed(2)),
    weeklyRealizedPnL: Number((account.weeklyRealizedPnL + realizedPnL).toFixed(2)),
  };

  return {
    account: updatedAccount,
    execution: {
      order,
      position: updatedPositions.find(p => p.symbol === order.symbol),
      closedPositionId: closedPosId,
      realizedPnL,
    },
  };
}

/**
 * Updates positions with latest tick prices, checking stop-loss and take-profit triggers
 */
export function updatePositionsMarketPrice(
  account: PaperAccount,
  marketPrices: Record<string, number>
): { updatedAccount: PaperAccount; triggeredOrders: Order[] } {
  let updatedPositions = [...account.positions];
  const triggeredOrders: Order[] = [];
  let updatedCashUSD = account.cashUSD;
  let updatedDailyPnL = account.dailyRealizedPnL;
  let updatedWeeklyPnL = account.weeklyRealizedPnL;

  const remainingPositions: Position[] = [];

  for (const pos of updatedPositions) {
    const currentPrice = marketPrices[pos.symbol] ?? pos.currentPrice;
    let isClosed = false;
    let closeReason: 'STOP_LOSS' | 'TAKE_PROFIT' | null = null;

    if (pos.side === 'BUY') {
      if (currentPrice <= pos.stopLossPrice) {
        isClosed = true;
        closeReason = 'STOP_LOSS';
      } else if (pos.takeProfitPrice && currentPrice >= pos.takeProfitPrice) {
        isClosed = true;
        closeReason = 'TAKE_PROFIT';
      }
    }

    if (isClosed && closeReason) {
      // Execute automatic trigger order
      const fee = calculateSimulatedFee(currentPrice, pos.quantity);
      const realizedPnL = (currentPrice - pos.entryPrice) * pos.quantity - fee;
      updatedCashUSD += (currentPrice * pos.quantity) - fee;
      updatedDailyPnL += realizedPnL;
      updatedWeeklyPnL += realizedPnL;

      const triggerOrder: Order = {
        id: `ord_trig_${Math.random().toString(36).substring(2, 9)}`,
        clientOrderId: `auto_${closeReason.toLowerCase()}_${Date.now()}`,
        symbol: pos.symbol,
        side: 'SELL',
        type: 'MARKET',
        quantity: pos.quantity,
        targetPrice: currentPrice,
        stopLossPrice: pos.stopLossPrice,
        executedPrice: currentPrice,
        slippage: 0,
        fee,
        state: 'FILLED',
        stateHistory: [
          { state: 'CREATED', timestamp: Date.now() },
          { state: 'FILLED', timestamp: Date.now(), message: `Acionado automaticamente por ${closeReason}` },
        ],
        currency: pos.currency,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPaper: true,
      };

      triggeredOrders.push(triggerOrder);
    } else {
      // Position remains open
      const diff = currentPrice - pos.entryPrice;
      const unrealizedPnL = pos.side === 'BUY' ? diff * pos.quantity : -diff * pos.quantity;
      const positionValue = pos.entryPrice * pos.quantity;
      const unrealizedPnLPct = positionValue > 0 ? (unrealizedPnL / positionValue) * 100 : 0;

      remainingPositions.push({
        ...pos,
        currentPrice,
        unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
        unrealizedPnLPct: Number(unrealizedPnLPct.toFixed(2)),
      });
    }
  }

  const remainingMarketValueUSD = remainingPositions.reduce((acc, p) => {
    const value = p.currentPrice * p.quantity;
    return acc + (p.currency === 'EUR' ? value * account.eurUsdRate : value);
  }, 0);
  const updatedEquityUSD = updatedCashUSD + remainingMarketValueUSD;
  const updatedEquityEUR = updatedEquityUSD / account.eurUsdRate;

  return {
    updatedAccount: {
      ...account,
      cashUSD: Number(updatedCashUSD.toFixed(2)),
      cashEUR: Number((updatedCashUSD / account.eurUsdRate).toFixed(2)),
      equityUSD: Number(updatedEquityUSD.toFixed(2)),
      equityEUR: Number(updatedEquityEUR.toFixed(2)),
      positions: remainingPositions,
      orders: [...triggeredOrders, ...account.orders],
      dailyRealizedPnL: Number(updatedDailyPnL.toFixed(2)),
      weeklyRealizedPnL: Number(updatedWeeklyPnL.toFixed(2)),
    },
    triggeredOrders,
  };
}
