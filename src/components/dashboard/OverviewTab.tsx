import React, { useState } from 'react';
import { MarketAsset, Position, Order, Currency, RiskConfig } from '../../types/trading';
import { TradingChart } from './TradingChart';
import { buildIndicatorSnapshot } from '../../core/indicators';
import { generateCandlesForAsset } from '../../services/marketData';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  Shield, 
  PlusCircle, 
  Sliders, 
  AlertTriangle,
  Bot
} from 'lucide-react';

interface OverviewTabProps {
  assets: MarketAsset[];
  selectedAsset: MarketAsset;
  onSelectAsset: (asset: MarketAsset) => void;
  positions: Position[];
  orders: Order[];
  equityUSD: number;
  cashUSD: number;
  equityEUR: number;
  cashEUR: number;
  currency: Currency;
  dailyPnL: number;
  weeklyPnL: number;
  riskConfig: RiskConfig;
  onOpenTradeModal: (asset: MarketAsset) => void;
  onClosePosition: (positionId: string) => void;
  onNavigateToAgents: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  positions,
  orders,
  equityUSD,
  cashUSD,
  equityEUR,
  cashEUR,
  currency,
  dailyPnL,
  weeklyPnL,
  riskConfig,
  onOpenTradeModal,
  onClosePosition,
  onNavigateToAgents,
}) => {
  const [closingPosId, setClosingPosId] = useState<string | null>(null);

  // Generate candle series and indicator snapshot for selected asset
  const candles = React.useMemo(() => {
    return generateCandlesForAsset(selectedAsset.price, 60, 60);
  }, [selectedAsset.symbol, selectedAsset.price]);

  const indicators = React.useMemo(() => {
    return buildIndicatorSnapshot(candles);
  }, [candles]);

  const currentEquity = currency === 'USD' ? equityUSD : equityEUR;
  const currentCash = currency === 'USD' ? cashUSD : cashEUR;
  const dailyPnLPct = equityUSD > 0 ? (dailyPnL / equityUSD) * 100 : 0;
  const weeklyPnLPct = equityUSD > 0 ? (weeklyPnL / equityUSD) * 100 : 0;

  const totalExposure = positions.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
  const exposurePct = equityUSD > 0 ? (totalExposure / equityUSD) * 100 : 0;

  const confirmClosePosition = (posId: string) => {
    onClosePosition(posId);
    setClosingPosId(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric Strips (Zero-Pill, Single-Elevation, Tabular Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Patrimônio Total */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Patrimônio Líquido</span>
            <Wallet className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {currency === 'USD' ? '$' : '€'}
            {currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <span>Disponível em Caixa:</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {currency === 'USD' ? '$' : '€'}
              {currentCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2: Resultado Diário (PnL) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Resultado do Dia</span>
            {dailyPnL >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className={`text-xl font-bold font-mono tabular-nums ${dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {dailyPnL >= 0 ? '+' : ''}
            {currency === 'USD' ? '$' : '€'}
            {dailyPnL.toFixed(2)}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <span>Variação:</span>
            <span className={`font-mono font-medium ${dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {dailyPnLPct >= 0 ? '+' : ''}{dailyPnLPct.toFixed(2)}%
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Limite: 2.0%</span>
          </div>
        </div>

        {/* Card 3: Resultado Semanal */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Resultado Semanal</span>
            <TrendingUp className="w-4 h-4 text-slate-500" />
          </div>
          <div className={`text-xl font-bold font-mono tabular-nums ${weeklyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {weeklyPnL >= 0 ? '+' : ''}
            {currency === 'USD' ? '$' : '€'}
            {weeklyPnL.toFixed(2)}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <span>Retorno Semanal:</span>
            <span className={`font-mono font-medium ${weeklyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {weeklyPnLPct >= 0 ? '+' : ''}{weeklyPnLPct.toFixed(2)}%
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Teto: 5.0%</span>
          </div>
        </div>

        {/* Card 4: Gestão de Risco & Exposição */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Exposição em Risco</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {exposurePct.toFixed(1)}%
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <span>Posições Ativas:</span>
            <span className="font-mono text-slate-200">{positions.length}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400">Stop Obrigatório Ativo</span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Split: Chart & Fast Order Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 cols: Interactive Chart */}
        <div className="lg:col-span-3 space-y-4">
          {/* Asset Switcher Quick Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            {assets.slice(0, 8).map((a) => (
              <button
                key={a.symbol}
                onClick={() => onSelectAsset(a)}
                className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  selectedAsset.symbol === a.symbol
                    ? 'bg-slate-800 text-white border border-slate-700 font-semibold shadow-xs'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <span>{a.symbol}</span>
                <span className={`ml-2 ${a.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {a.change24h >= 0 ? '+' : ''}{a.change24h}%
                </span>
              </button>
            ))}
          </div>

          <TradingChart
            candles={candles}
            symbol={selectedAsset.symbol}
            indicators={indicators}
            currency={currency}
          />
        </div>

        {/* Right 1 col: Fast Action Card & Agent Status */}
        <div className="space-y-4">
          {/* Quick Ticket Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Boleta Rápida
              </span>
              <span className="text-xs text-slate-400 font-mono">{selectedAsset.symbol}</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Preço Mercado:</span>
                <span className="text-white font-bold">${selectedAsset.price.toFixed(selectedAsset.decimalPlaces)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spread:</span>
                <span className="text-slate-300">${selectedAsset.spread.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risco Máximo:</span>
                <span className="text-emerald-400 font-semibold">{riskConfig.maxRiskPerTradePct}% do patrimônio</span>
              </div>
            </div>

            <button
              onClick={() => onOpenTradeModal(selectedAsset)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Abrir Ticket com Validação de Risco</span>
            </button>
          </div>

          {/* AI Committee Quick Recommendation Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                Comitê de IA
              </span>
              <span className="text-[11px] text-slate-400">5 Agentes</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Consenso quantitativo para <strong>{selectedAsset.symbol}</strong>: Tendência {indicators.trend} com RSI em {indicators.rsi14.toFixed(1)}.
            </p>

            <button
              onClick={onNavigateToAgents}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded text-xs font-mono border border-indigo-500/20 transition-colors cursor-pointer"
            >
              Consultar Comitê Completo →
            </button>
          </div>
        </div>
      </div>

      {/* 3. Open Positions Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Posições Abertas ({positions.length})
            </h3>
            <span className="text-xs text-slate-500">· Simulação Paper Trading</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Exposição Total: ${totalExposure.toFixed(2)}
          </span>
        </div>

        {positions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono space-y-2">
            <p>Nenhuma posição aberta no momento.</p>
            <p className="text-[11px] text-slate-600">Selecione um ativo acima e abra uma ordem com stop-loss obrigatório.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-2.5">Ativo</th>
                  <th className="px-5 py-2.5">Lado</th>
                  <th className="px-5 py-2.5 text-right">Qtd</th>
                  <th className="px-5 py-2.5 text-right">Entrada</th>
                  <th className="px-5 py-2.5 text-right">Atual</th>
                  <th className="px-5 py-2.5 text-right">Stop-Loss</th>
                  <th className="px-5 py-2.5 text-right">Lucro/Prejuízo</th>
                  <th className="px-5 py-2.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {positions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 font-bold text-white">{pos.symbol}</td>
                    <td className="px-5 py-3">
                      <span className={pos.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                        {pos.side === 'BUY' ? 'COMPRA (LONG)' : 'VENDA (SHORT)'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-300 tabular-nums">{pos.quantity}</td>
                    <td className="px-5 py-3 text-right text-slate-300 tabular-nums">${pos.entryPrice.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-white tabular-nums">${pos.currentPrice.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-amber-400 tabular-nums">${pos.stopLossPrice.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      <div className={pos.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        <span>{pos.unrealizedPnL >= 0 ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}</span>
                        <span className="text-[10px] ml-1.5">({pos.unrealizedPnLPct >= 0 ? '+' : ''}{pos.unrealizedPnLPct.toFixed(2)}%)</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {closingPosId === pos.id ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => confirmClosePosition(pos.id)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setClosingPosId(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                          >
                            Voltar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setClosingPosId(pos.id)}
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                        >
                          Encerrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
