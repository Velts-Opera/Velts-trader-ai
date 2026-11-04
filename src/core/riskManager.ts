import { Order, Position, RiskConfig } from '../types/trading';

export interface RiskEvaluationResult {
  isApproved: boolean;
  rejectionReason?: string;
  violations: string[];
  maxAllowedQuantity: number;
  calculatedRiskUSD: number;
  riskPct: number;
  newExposurePct: number;
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxRiskPerTradePct: 0.5,       // 0.5% per trade
  dailyLossLimitPct: 2.0,        // 2.0% daily max loss
  weeklyLossLimitPct: 5.0,       // 5.0% weekly max loss
  maxAssetExposurePct: 10.0,     // 10.0% max exposure per asset
  allowLeverage: false,          // Leverage strictly disabled
  requireStopLoss: true,         // Mandatory stop loss
  emergencyStopActivated: false, // Emergency kill-switch
  prohibitAveragingDown: true,   // Prohibit adding to losing trades
};

/**
 * Calculates optimal position size based on equity and risk per trade
 */
export function calculatePositionSize(
  equity: number,
  entryPrice: number,
  stopLossPrice: number,
  maxRiskPct: number = 0.5
): number {
  if (equity <= 0 || entryPrice <= 0 || stopLossPrice <= 0) return 0;
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  if (priceDistance <= 0) return 0;

  const dollarRiskAllowed = equity * (maxRiskPct / 100);
  const rawQuantity = dollarRiskAllowed / priceDistance;

  // Exposure ceiling: max 10% of total equity in a single position
  const maxPositionValue = equity * 0.10;
  const maxQtyByExposure = maxPositionValue / entryPrice;

  const finalQty = Math.min(rawQuantity, maxQtyByExposure);
  return Number(finalQty.toFixed(6));
}

/**
 * Deterministic Risk Manager pre-flight validation
 */
export function evaluateOrderRisk(
  order: Omit<Order, 'id' | 'state' | 'stateHistory' | 'createdAt' | 'updatedAt' | 'slippage' | 'fee'>,
  currentEquity: number,
  dailyPnL: number,
  weeklyPnL: number,
  existingPositions: Position[],
  config: RiskConfig = DEFAULT_RISK_CONFIG
): RiskEvaluationResult {
  const violations: string[] = [];
  if (![currentEquity, dailyPnL, weeklyPnL, order.quantity, order.targetPrice ?? NaN, order.stopLossPrice ?? NaN].every(Number.isFinite) || currentEquity <= 0 || order.quantity <= 0 || !order.targetPrice || order.targetPrice <= 0 || !order.stopLossPrice || order.stopLossPrice <= 0) {
    violations.push('Parâmetros financeiros inválidos: operação bloqueada.');
  }
  if (![config.maxRiskPerTradePct, config.maxAssetExposurePct, config.dailyLossLimitPct, config.weeklyLossLimitPct].every(v => Number.isFinite(v) && v > 0)) {
    violations.push('Limites de risco inválidos: operação bloqueada.');
  }


  // 1. Emergency Kill-Switch Check
  if (config.emergencyStopActivated) {
    violations.push('PARADA DE EMERGÊNCIA ATIVA: Todas as novas operações estão bloqueadas.');
  }

  // 2. Stop-Loss Requirement Check
  if (config.requireStopLoss) {
    if (!order.stopLossPrice || order.stopLossPrice <= 0) {
      violations.push('Stop-loss é estritamente obrigatório para todas as ordens.');
    } else {
      if (order.side === 'BUY' && order.targetPrice && order.stopLossPrice >= order.targetPrice) {
        violations.push('Para ordens de COMPRA, o Stop-loss deve ser inferior ao preço de entrada.');
      }
      if (order.side === 'SELL' && order.targetPrice && order.stopLossPrice <= order.targetPrice) {
        violations.push('Para ordens de VENDA, o Stop-loss deve ser superior ao preço de entrada.');
      }
    }
  }

  // 3. Daily Loss Limit Check (e.g. 2%)
  const dailyLossLimitUSD = currentEquity * (config.dailyLossLimitPct / 100);
  if (dailyPnL <= -dailyLossLimitUSD) {
    violations.push(
      `Limite de perda diária atingido (${config.dailyLossLimitPct}% = -$${dailyLossLimitUSD.toFixed(2)}). Bloqueio automático de novas operações.`
    );
  }

  // 4. Weekly Loss Limit Check (e.g. 5%)
  const weeklyLossLimitUSD = currentEquity * (config.weeklyLossLimitPct / 100);
  if (weeklyPnL <= -weeklyLossLimitUSD) {
    violations.push(
      `Limite de perda semanal atingido (${config.weeklyLossLimitPct}% = -$${weeklyLossLimitUSD.toFixed(2)}). Bloqueio automático semanal.`
    );
  }

  const price = order.targetPrice ?? 0;
  const orderValue = price * order.quantity;

  // 5. Single Trade Risk Check (max 0.5% equity)
  let calculatedRiskUSD = 0;
  let riskPct = 0;
  if (order.stopLossPrice && price > 0) {
    const riskPerUnit = Math.abs(price - order.stopLossPrice);
    calculatedRiskUSD = riskPerUnit * order.quantity;
    riskPct = currentEquity > 0 ? (calculatedRiskUSD / currentEquity) * 100 : 0;

    if (riskPct > config.maxRiskPerTradePct) { // allow 5% floating tolerance for rounding
      violations.push(
        `Risco planejado (${riskPct.toFixed(2)}%) excede o teto permitido de ${config.maxRiskPerTradePct}% do patrimônio.`
      );
    }
  }

  // 6. Max Asset Exposure Check (max 10% equity)
  const existingAssetPosition = existingPositions.find(p => p.symbol === order.symbol);
  const currentAssetValue = existingAssetPosition ? existingAssetPosition.quantity * price : 0;
  const newAssetValue = currentAssetValue + orderValue;
  const newExposurePct = currentEquity > 0 ? (newAssetValue / currentEquity) * 100 : 0;

  if (newExposurePct > config.maxAssetExposurePct) {
    violations.push(
      `Exposição no ativo (${newExposurePct.toFixed(1)}%) ultrapassará o limite máximo de ${config.maxAssetExposurePct}%.`
    );
  }

  // 7. Prohibit Averaging Down on Losing Positions
  if (config.prohibitAveragingDown && existingAssetPosition) {
    const isLosing = existingAssetPosition.unrealizedPnL < 0;
    if (isLosing && existingAssetPosition.side === order.side) {
      violations.push(
        'Proibido aumentar posição perdedora (averaging down) sem regra previamente validada.'
      );
    }
  }

  // Calculate safe recommended quantity
  const safeQty = price > 0 && order.stopLossPrice > 0
    ? calculatePositionSize(currentEquity, price, order.stopLossPrice, config.maxRiskPerTradePct)
    : order.quantity;

  if (Number.isFinite(safeQty) && order.quantity > safeQty + 1e-10) violations.push('Quantidade excede o limite seguro.');
  const isApproved = violations.length === 0;

  return {
    isApproved,
    rejectionReason: violations.length > 0 ? violations[0] : undefined,
    violations,
    maxAllowedQuantity: safeQty,
    calculatedRiskUSD: Number(calculatedRiskUSD.toFixed(2)),
    riskPct: Number(riskPct.toFixed(3)),
    newExposurePct: Number(newExposurePct.toFixed(2)),
  };
}
