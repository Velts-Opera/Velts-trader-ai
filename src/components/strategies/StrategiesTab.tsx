import React, { useState } from 'react';
import { StrategyDefinition, OrderState } from '../../types/trading';
import { Play, Pause, Zap, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface StrategiesTabProps {
  strategies: StrategyDefinition[];
  onToggleStrategy: (id: string) => void;
  isAutomatedExecutionRunning: boolean;
  onToggleAutomation: () => void;
  onRunStrategyCycle: () => void;
}

export const StrategiesTab: React.FC<StrategiesTabProps> = ({
  strategies,
  onToggleStrategy,
  isAutomatedExecutionRunning,
  onToggleAutomation,
  onRunStrategyCycle,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyDefinition>(strategies[0]);

  // Order state machine visualization flow
  const orderStates: { state: OrderState; label: string; desc: string }[] = [
    { state: 'CREATED', label: '1. Criada', desc: 'Identificador único e nonce gerados' },
    { state: 'VALIDATED', label: '2. Validada', desc: 'Checagem determinística de risco e saldo' },
    { state: 'SUBMITTED', label: '3. Enviada', desc: 'Roteamento seguro para a corretora' },
    { state: 'PARTIALLY_FILLED', label: '4. Parcial', desc: 'Preenchimento progressivo de lote' },
    { state: 'FILLED', label: '5. Executada', desc: 'Preenchida integralmente com slippage registrado' },
  ];

  const alternativeStates = [
    { state: 'REJECTED', label: 'Rejeitada', desc: 'Violou limites de risco (0.5% risco, perda diária 2% ou sem stop loss)' },
    { state: 'CANCELLED', label: 'Cancelada', desc: 'Cancelamento manual pelo operador' },
    { state: 'EXPIRED', label: 'Expirada', desc: 'Tempo limite de execução atingido' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Automation Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-lg p-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Motor Autônomo de Estratégias & Sinais Quantitativos
            </h2>
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded ${
                isAutomatedExecutionRunning
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isAutomatedExecutionRunning ? 'LOOP PERSISTENTE ATIVO' : 'EXECUÇÃO MANUAL / PAUSADA'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Avalia continuamente os indicadores de mercado, gera sinais e despacha ordens simuladas dentro das regras do Gerenciador de Risco.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunStrategyCycle}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Executar 1 Ciclo Agora</span>
          </button>

          <button
            onClick={onToggleAutomation}
            className={`flex items-center gap-2 px-5 py-2 rounded text-xs font-bold font-mono transition-colors shadow-md cursor-pointer ${
              isAutomatedExecutionRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isAutomatedExecutionRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pausar Automação</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Iniciar Automação Contínua</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Strategies List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: Available Strategies */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Estratégias Quantitativas
            </h3>
          </div>

          <div className="divide-y divide-slate-800/60">
            {strategies.map((strat) => (
              <div
                key={strat.id}
                onClick={() => setSelectedStrategy(strat)}
                className={`p-4 cursor-pointer hover:bg-slate-800/40 transition-colors ${
                  selectedStrategy.id === strat.id ? 'bg-slate-800/30' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{strat.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStrategy(strat.id);
                    }}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer ${
                      strat.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {strat.isActive ? 'ATIVA' : 'INATIVA'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2">
                  {strat.description}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-2">
                  <span>Win Rate Est: <strong className="text-emerald-400">{strat.winRateEstimated}%</strong></span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>Sharpe: <strong className="text-white">{strat.sharpeEstimated}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 cols: Strategy Inspector & State Machine */}
        <div className="lg:col-span-2 space-y-6">
          {/* Strategy Details Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">{selectedStrategy.name}</h3>
                <span className="text-xs text-slate-400">Categoria: {selectedStrategy.category} · Timeframe: {selectedStrategy.timeframe}</span>
              </div>
              <button
                onClick={() => onToggleStrategy(selectedStrategy.id)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded cursor-pointer ${
                  selectedStrategy.isActive
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-800 hover:bg-rose-900'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {selectedStrategy.isActive ? 'Desativar Estratégia' : 'Ativar Estratégia'}
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {selectedStrategy.description}
            </p>

            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                Parâmetros Quantitativos:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                {Object.entries(selectedStrategy.parameters).map(([key, val]) => (
                  <div key={key} className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">{key}</span>
                    <span className="text-slate-200 font-bold">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Machine of States Visualization (Section 5 requirement) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Máquina de Estados de Execução de Ordens (Deterministic State Machine)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cada ordem avança rigidamente através de transições matemáticas validadas com reconciliação e proteção contra duplicidade.
              </p>
            </div>

            {/* Primary Happy Path */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
              {orderStates.map((st, i) => (
                <div key={st.state} className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center space-y-1">
                  <span className="text-xs font-bold font-mono text-emerald-400 block">{st.label}</span>
                  <span className="text-[10px] text-slate-400 font-sans block leading-tight">{st.desc}</span>
                </div>
              ))}
            </div>

            {/* Alternative Terminal States */}
            <div className="pt-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                Estados Alternativos & Falhas Seguras:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {alternativeStates.map((alt) => (
                  <div key={alt.state} className="bg-slate-950/40 border border-slate-800/80 p-2.5 rounded text-xs space-y-0.5">
                    <span className="font-mono font-bold text-rose-400">{alt.state} ({alt.label})</span>
                    <p className="text-[10px] text-slate-400 font-sans leading-tight">{alt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
