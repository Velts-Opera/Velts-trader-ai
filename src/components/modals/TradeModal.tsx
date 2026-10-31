import React, { useState, useEffect } from 'react';
import { MarketAsset, OrderSide, OrderType, Currency, RiskConfig } from '../../types/trading';
import { calculatePositionSize, evaluateOrderRisk } from '../../core/riskManager';
import { calculateSimulatedSlippage, calculateSimulatedFee } from '../../core/tradingEngine';
import { X, ShieldCheck, AlertOctagon, TrendingUp, TrendingDown } from 'lucide-react';

export interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MarketAsset;
  equityUSD: number;
  currency: Currency;
  riskConfig: RiskConfig;
  onExecuteOrder: (params: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    targetPrice: number;
    stopLossPrice: number;
    takeProfitPrice?: number;
  }) => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  asset,
  equityUSD,
  currency,
  riskConfig,
  onExecuteOrder,
}) => {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [targetPrice, setTargetPrice] = useState<number>(asset.price);
  const [stopLossPrice, setStopLossPrice] = useState<number>(0);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    setTargetPrice(asset.price);
    const slDistance = asset.price * 0.02;
    const initialSL = side === 'BUY' ? asset.price - slDistance : asset.price + slDistance;
    const initialTP = side === 'BUY' ? asset.price + slDistance * 2.5 : asset.price - slDistance * 2.5;
    setStopLossPrice(Number(initialSL.toFixed(asset.decimalPlaces)));
    setTakeProfitPrice(Number(initialTP.toFixed(asset.decimalPlaces)));

    const safeQty = calculatePositionSize(equityUSD, asset.price, initialSL, riskConfig.maxRiskPerTradePct);
    setQuantity(Math.max(asset.minOrderSize || 0.01, safeQty || 1));
  }, [asset, side, equityUSD, riskConfig.maxRiskPerTradePct]);

  if (!isOpen) return null;

  const currentPrice = orderType === 'MARKET' ? asset.price : targetPrice;
  const orderValue = currentPrice * quantity;
  const exposurePct = equityUSD > 0 ? (orderValue / equityUSD) * 100 : 0;
  const riskAmount = Math.abs(currentPrice - stopLossPrice) * quantity;
  const riskPct = equityUSD > 0 ? (riskAmount / equityUSD) * 100 : 0;

  const slippage = calculateSimulatedSlippage(currentPrice, asset.spread, side);
  const estFee = calculateSimulatedFee(currentPrice, quantity);

  const riskEval = evaluateOrderRisk(
    {
      clientOrderId: 'eval',
      symbol: asset.symbol,
      side,
      type: orderType,
      quantity,
      targetPrice: currentPrice,
      stopLossPrice,
      takeProfitPrice,
      currency,
      isPaper: true,
    },
    equityUSD,
    0,
    0,
    [],
    riskConfig
  );

  const handleApplySafeSize = () => {
    if (stopLossPrice > 0 && currentPrice > 0) {
      const safe = calculatePositionSize(equityUSD, currentPrice, stopLossPrice, riskConfig.maxRiskPerTradePct);
      setQuantity(Math.max(asset.minOrderSize || 0.01, safe));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskEval.isApproved) return;

    onExecuteOrder({
      symbol: asset.symbol,
      side,
      type: orderType,
      quantity,
      targetPrice: currentPrice,
      stopLossPrice,
      takeProfitPrice: takeProfitPrice > 0 ? takeProfitPrice : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white font-mono">{asset.symbol}</span>
            <span className="text-xs text-slate-400">· {asset.name}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Order Side Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded font-semibold text-xs tracking-wider transition-colors cursor-pointer ${
                side === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              COMPRAR (LONG)
            </button>
            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded font-semibold text-xs tracking-wider transition-colors cursor-pointer ${
                side === 'SELL'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              VENDER (SHORT)
            </button>
          </div>

          {/* Order Type & Target Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">
                Tipo de Ordem
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="MARKET">Mercado (Market)</option>
                <option value="LIMIT">Limite (Limit)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">
                Preço ({asset.currency})
              </label>
              <input
                type="number"
                step="any"
                disabled={orderType === 'MARKET'}
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 disabled:opacity-60 rounded px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quantity & Sizing */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400 uppercase font-mono">
                Quantidade
              </label>
              <button
                type="button"
                onClick={handleApplySafeSize}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono cursor-pointer"
              >
                Auto-Tamanho Seguro ({riskConfig.maxRiskPerTradePct}% risco)
              </button>
            </div>
            <input
              type="number"
              step="any"
              min="0.0001"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Stop-Loss & Take-Profit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-amber-400 uppercase font-mono mb-1">
                Stop-Loss (Obrigatório) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-amber-500/50 rounded px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">
                Take-Profit (Alvo Opcional)
              </label>
              <input
                type="number"
                step="any"
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Risk & Execution Summary Box */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Valor da Ordem:</span>
              <span className="text-white">${orderValue.toFixed(2)} ({exposurePct.toFixed(1)}% do total)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Risco Planejado (Stop):</span>
              <span className={riskPct > riskConfig.maxRiskPerTradePct ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                ${riskAmount.toFixed(2)} ({riskPct.toFixed(2)}% do patrimônio)
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Slippage Estimado:</span>
              <span className="text-slate-300">${slippage.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Taxa de Corretora:</span>
              <span className="text-slate-300">${estFee.toFixed(2)}</span>
            </div>
          </div>

          {/* Risk Rejection Banner */}
          {!riskEval.isApproved && (
            <div className="flex items-start gap-2 bg-rose-950/40 border border-rose-800/60 rounded p-3 text-xs text-rose-300">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Validação de Risco Reprovada:</span>
                <p className="mt-0.5 text-rose-200/90">{riskEval.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded border border-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!riskEval.isApproved}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded transition-colors cursor-pointer ${
                riskEval.isApproved
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>CONFIRMAR ORDEM (SIMULAÇÃO)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
