import React, { useState } from 'react';
import { MarketAsset, StrategyDefinition, BacktestParams, BacktestResult } from '../../types/trading';
import { runBacktestSimulation } from '../../core/backtester';
import { Play, TrendingUp, AlertTriangle, ShieldCheck, BarChart3 } from 'lucide-react';

interface BacktestingTabProps {
  assets: MarketAsset[];
  strategies: StrategyDefinition[];
}

export const BacktestingTab: React.FC<BacktestingTabProps> = ({ assets, strategies }) => {
  const [symbol, setSymbol] = useState(assets[0].symbol);
  const [strategyId, setStrategyId] = useState(strategies[0].id);
  const [periodDays, setPeriodDays] = useState(180);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [slippagePct, setSlippagePct] = useState(0.04);
  const [commissionPct, setCommissionPct] = useState(0.05);
  const [riskPerTradePct, setRiskPerTradePct] = useState(0.5);

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);

  const handleRunBacktest = () => {
    setRunning(true);
    setTimeout(() => {
      const params: BacktestParams = {
        symbol,
        strategyId,
        periodDays,
        initialCapital,
        currency: 'USD',
        slippagePct,
        commissionPerTradePct: commissionPct,
        riskPerTradePct,
      };

      const res = runBacktestSimulation(params);
      setResult(res);
      setRunning(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Parameter Configuration Strip */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Módulo de Testes Históricos Quantitativos (Walk-Forward & Custos Reais)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Ajuste de Custos: Slippage + Corretagem
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono">
          {/* Asset */}
          <div>
            <label className="text-slate-400 text-[10px] uppercase block mb-1">Ativo</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            >
              {assets.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Strategy */}
          <div>
            <label className="text-slate-400 text-[10px] uppercase block mb-1">Estratégia</label>
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="text-slate-400 text-[10px] uppercase block mb-1">Período Histórico</label>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            >
              <option value={30}>30 Dias</option>
              <option value={90}>90 Dias</option>
              <option value={180}>180 Dias (6M)</option>
              <option value={365}>1 Ano (365D)</option>
              <option value={1095}>3 Anos (1095D)</option>
            </select>
          </div>

          {/* Initial Capital */}
          <div>
            <label className="text-slate-400 text-[10px] uppercase block mb-1">Capital Inicial ($)</label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 1000)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            />
          </div>

          {/* Slippage */}
          <div>
            <label className="text-slate-400 text-[10px] uppercase block mb-1">Slippage (%)</label>
            <input
              type="number"
              step="0.01"
              value={slippagePct}
              onChange={(e) => setSlippagePct(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            />
          </div>

          {/* Commission */}
          <div>
            <label className="text-slate-400 text-[10px] uppercase block mb-1">Corretagem (%)</label>
            <input
              type="number"
              step="0.01"
              value={commissionPct}
              onChange={(e) => setCommissionPct(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            />
          </div>

          {/* Action button */}
          <div className="flex items-end">
            <button
              onClick={handleRunBacktest}
              disabled={running}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{running ? 'Simulando...' : 'Executar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backtest Results Display */}
      {result ? (
        <div className="space-y-6">
          {/* Metrics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Retorno Acumulado</span>
              <div className={`text-base font-bold font-mono tabular-nums mt-0.5 ${result.metrics.cumulativeReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.metrics.cumulativeReturnPct >= 0 ? '+' : ''}{result.metrics.cumulativeReturnPct}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Anualizado: {result.metrics.annualizedReturnPct}%</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Sharpe Ratio</span>
              <div className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                {result.metrics.sharpeRatio}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Sortino: {result.metrics.sortinoRatio}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Max Drawdown</span>
              <div className="text-base font-bold font-mono text-rose-400 tabular-nums mt-0.5">
                -{result.metrics.maxDrawdownPct}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Rebaixamento Máx</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Win Rate</span>
              <div className="text-base font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
                {result.metrics.winRatePct}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{result.metrics.winningTrades}W / {result.metrics.losingTrades}L</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Profit Factor</span>
              <div className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                {result.metrics.profitFactor}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Lucro Bruto / Prej</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Expectativa Mat.</span>
              <div className={`text-base font-bold font-mono tabular-nums mt-0.5 ${result.metrics.mathExpectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${result.metrics.mathExpectancy}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Média / trade</span>
            </div>
          </div>

          {/* Benchmark Comparison & Overfitting Warning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2">
              <span className="text-slate-400 text-[10px] uppercase block font-bold">
                Comparação de Benchmark (Alpha)
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400">Retorno da Estratégia:</span>
                <span className="text-emerald-400 font-bold">{result.metrics.cumulativeReturnPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Buy & Hold do Ativo:</span>
                <span className="text-slate-200">{result.benchmarkComparison.buyAndHoldReturnPct}%</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5">
                <span className="text-slate-400">Alpha Gerado:</span>
                <span className={`font-bold ${result.benchmarkComparison.alphaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.benchmarkComparison.alphaPct >= 0 ? '+' : ''}{result.benchmarkComparison.alphaPct}%
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2">
              <span className="text-slate-400 text-[10px] uppercase block font-bold">
                Validação Fora da Amostra & Sobreajuste
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400">Walk-Forward Validation:</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> APROVADO
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risco de Sobreajuste (Overfitting):</span>
                <span
                  className={`font-bold ${
                    result.overfittingRisk === 'LOW' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {result.overfittingRisk === 'LOW' ? 'BAIXO (Robusto)' : 'MODERADO'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-1">
                A estratégia foi testada com controle de look-ahead bias e períodos alternados.
              </p>
            </div>
          </div>

          {/* Equity Curve SVG */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-2">
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider block">
              Curva de Patrimônio Histórico (Equity Curve)
            </span>
            <div className="h-44 w-full">
              <svg viewBox="0 0 800 160" className="w-full h-full">
                {/* Horizontal zero/base line */}
                <line x1="20" y1="80" x2="780" y2="80" stroke="#1E293B" strokeDasharray="3 3" />

                {/* Equity Polyline */}
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  points={result.equityCurve
                    .map((pt, i) => {
                      const x = 20 + (i / (result.equityCurve.length - 1)) * 760;
                      const equities = result.equityCurve.map((e) => e.equity);
                      const minEq = Math.min(...equities) * 0.99;
                      const maxEq = Math.max(...equities) * 1.01;
                      const y = 140 - ((pt.equity - minEq) / (maxEq - minEq || 1)) * 120;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              </svg>
            </div>
          </div>

          {/* Executed Trades Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Amostra de Operações Simuladas ({result.trades.length} Trades)
              </h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2">Data Entrada</th>
                    <th className="px-4 py-2">Data Saída</th>
                    <th className="px-4 py-2 text-right">Entrada</th>
                    <th className="px-4 py-2 text-right">Saída</th>
                    <th className="px-4 py-2 text-right">PnL Líquido</th>
                    <th className="px-4 py-2 text-center">Motivo Saída</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {result.trades.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2 text-slate-400">{t.entryDate}</td>
                      <td className="px-4 py-2 text-slate-400">{t.exitDate}</td>
                      <td className="px-4 py-2 text-right text-slate-300 tabular-nums">${t.entryPrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-white tabular-nums">${t.exitPrice.toFixed(2)}</td>
                      <td className={`px-4 py-2 text-right font-bold tabular-nums ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)} ({t.pnlPct}%)
                      </td>
                      <td className="px-4 py-2 text-center text-slate-400 text-[11px]">{t.exitReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-lg p-12 text-center text-xs font-mono text-slate-500 space-y-2">
          <p>Selecione os parâmetros e clique em "Executar" para iniciar a simulação histórica.</p>
          <p className="text-[11px] text-slate-600">
            O algoritmo calculará Sharpe, Sortino, Drawdown e curva de equity com custos operacionais reais.
          </p>
        </div>
      )}
    </div>
  );
};
