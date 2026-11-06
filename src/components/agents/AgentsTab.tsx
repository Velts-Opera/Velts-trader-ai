import React, { useState } from 'react';
import { MarketAsset, CommitteeDecision, Currency } from '../../types/trading';
import { buildIndicatorSnapshot } from '../../core/indicators';
import { runAgentCommitteeAnalysis } from '../../services/geminiAgents';
import { 
  Bot, 
  BrainCircuit, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  AlertOctagon, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface AgentsTabProps {
  assets: MarketAsset[];
  selectedAsset: MarketAsset;
  onSelectAsset: (asset: MarketAsset) => void;
  currency: Currency;
  onApplyRecommendationToTrade: (decision: CommitteeDecision) => void;
}

export const AgentsTab: React.FC<AgentsTabProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  currency,
  onApplyRecommendationToTrade,
}) => {
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<CommitteeDecision | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleRunCommittee = async () => {
    setLoading(true);
    setAnalysisError(null);
    setDecision(null);
    try {
      const pair = selectedAsset.symbol.replace('/', '') + 'T';
      const response = await fetch(`/api/market/binance/candles?symbol=${encodeURIComponent(pair)}&interval=1h&limit=200`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Candles reais indisponíveis para este ativo.');
      const payload = await response.json() as { candles: import('../../types/trading').Candle[] };
      if (!Array.isArray(payload.candles) || payload.candles.length < 200) {
        throw new Error('Histórico insuficiente para análise.');
      }
      const indicators = buildIndicatorSnapshot(payload.candles);
      const res = await runAgentCommitteeAnalysis(
        selectedAsset.symbol,
        payload.candles[payload.candles.length - 1].close,
        indicators,
        currency,
        `Mercado ${selectedAsset.category}. Volume 24h: $${selectedAsset.volume24h.toLocaleString()}. Spread: $${selectedAsset.spread}.`
      );
      setDecision(res);
    } catch (err) {
      console.error('Analysis unavailable:', err);
      setAnalysisError(err instanceof Error ? err.message : 'Análise indisponível.');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return (
          <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono text-[11px]">
            <TrendingUp className="w-3.5 h-3.5" /> ALTA (BULLISH)
          </span>
        );
      case 'BEARISH':
        return (
          <span className="flex items-center gap-1 text-rose-400 font-bold font-mono text-[11px]">
            <TrendingDown className="w-3.5 h-3.5" /> BAIXA (BEARISH)
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-slate-400 font-bold font-mono text-[11px]">
            <Minus className="w-3.5 h-3.5" /> NEUTRO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Análise Assistida — CodexTrader V1
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                Gemini opcional
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Módulo experimental: análise baseada em candles reais; não equivale à aprovação de ordens.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Asset Select */}
          <select
            value={selectedAsset.symbol}
            onChange={(e) => {
              const found = assets.find((a) => a.symbol === e.target.value);
              if (found) {
                onSelectAsset(found);
                setDecision(null);
              }
            }}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-hidden"
          >
            {assets.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol} — ${a.price.toFixed(a.decimalPlaces)}
              </option>
            ))}
          </select>

          <button
            onClick={handleRunCommittee}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-xs font-mono transition-colors shadow-md cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Deliberando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Executar Deliberação do Comitê</span>
              </>
            )}
          </button>
        </div>
      </div>

      {analysisError && (
        <div role="alert" className="border border-rose-500/30 bg-slate-900 rounded p-4 text-sm text-rose-300">
          {analysisError}
        </div>
      )}

      {/* Decision Showcase Banner (Supervisor Consensus) */}
      {decision && (
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Consenso do Supervisor Geral
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono text-white">{decision.symbol}</span>
                <span
                  className={`text-sm font-bold font-mono px-3 py-1 rounded ${
                    decision.action === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : decision.action === 'SELL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  RECOMENDAÇÃO: {decision.action}
                </span>
                <span className="text-xs font-mono text-indigo-300">
                  Confiança: {decision.confidenceScore}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onApplyRecommendationToTrade(decision)}
                className="flex items-center gap-2 px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono transition-colors cursor-pointer"
              >
                <span>Preencher Boleta de Trading</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Targets & Deterministic Risk Check */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
              <span className="text-slate-400 text-[10px] uppercase">Alvo Projetado (Target)</span>
              <div className="text-base font-bold text-white mt-0.5">
                ${decision.targetPrice.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
              <span className="text-amber-400 text-[10px] uppercase font-bold">Stop-Loss Obrigatório</span>
              <div className="text-base font-bold text-amber-400 mt-0.5">
                ${decision.recommendedStopLoss.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Guarda de Risco</span>
                <div className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{decision.riskPassed ? 'Indicação do módulo — não verificada pelo executor' : 'Não aprovado para execução'}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-3 rounded border border-slate-800/80">
            <strong>Parecer do Supervisor:</strong> {decision.supervisorRationale}
          </p>
        </div>
      )}

      {/* Grid of the 5 Specialized Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {decision ? (
          decision.reports.map((agent, index) => (
            <div
              key={index}
              className={`bg-slate-900/60 border rounded-xl p-5 space-y-4 ${
                agent.agentRole === 'RISK_MANAGER'
                  ? 'border-emerald-500/40 lg:col-span-2'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-indigo-400">
                    0{index + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight">
                      {agent.agentName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Confiança: {agent.confidencePct}%
                    </span>
                  </div>
                </div>

                <div>{getSentimentBadge(agent.sentiment)}</div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{agent.summary}</p>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Pontos Chave da Análise:
                </span>
                <ul className="space-y-1 text-xs text-slate-400 font-sans">
                  {agent.keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">·</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {agent.agentRole === 'RISK_MANAGER' && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs font-mono text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    O Supervisor não possui autoridade para desautorizar os limites matemáticos fixados por este agente.
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          /* Empty state introducing the 5 agents */
          [
            {
              num: '01',
              name: 'Agente 1 — Analista Técnico',
              desc: 'Calcula e interpreta em tempo real: RSI, MACD, médias móveis (EMA 20/50/200), Bandas de Bollinger, ATR e zonas de suporte/resistência.',
            },
            {
              num: '02',
              name: 'Agente 2 — Analista Fundamentalista',
              desc: 'Avalia dados macroeconômicos, taxas de juros, inflação, dados de balanços corporativos e fluxo de notícias financeiras globais.',
            },
            {
              num: '03',
              name: 'Agente 3 — Analista Quantitativo',
              desc: 'Testa estratégias históricas, estima probabilidades, identifica regimes de volatilidade e monitora riscos de sobreajuste estatístico.',
            },
            {
              num: '04',
              name: 'Agente 4 — Gerenciador de Risco',
              desc: 'Guardião determinístico inviolável. Aplica teto de risco de 0.5%, perda diária de 2%, stop-loss obrigatório e trava operações perdedoras.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-slate-500">{item.num}</span>
                <h4 className="text-xs font-bold text-white tracking-tight">{item.name}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
