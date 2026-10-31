import React, { useState } from 'react';
import { RiskConfig, Position } from '../../types/trading';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  AlertOctagon, 
  CheckCircle2, 
  Sliders,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface RiskTabProps {
  riskConfig: RiskConfig;
  onUpdateRiskConfig: (newConfig: RiskConfig) => void;
  equityUSD: number;
  dailyPnL: number;
  weeklyPnL: number;
  positions: Position[];
  onToggleEmergencyStop: () => void;
  onCloseAllPositions: () => void;
}

export const RiskTab: React.FC<RiskTabProps> = ({
  riskConfig,
  onUpdateRiskConfig,
  equityUSD,
  dailyPnL,
  weeklyPnL,
  positions,
  onToggleEmergencyStop,
  onCloseAllPositions,
}) => {
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);

  const dailyLossLimitUSD = equityUSD * (riskConfig.dailyLossLimitPct / 100);
  const weeklyLossLimitUSD = equityUSD * (riskConfig.weeklyLossLimitPct / 100);

  const dailyLossCurrentUSD = Math.abs(Math.min(0, dailyPnL));
  const dailyLossProgressPct = dailyLossLimitUSD > 0 ? (dailyLossCurrentUSD / dailyLossLimitUSD) * 100 : 0;

  const totalExposure = positions.reduce((acc, p) => acc + p.currentPrice * p.quantity, 0);
  const totalExposurePct = equityUSD > 0 ? (totalExposure / equityUSD) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Emergency Kill-Switch Hero Banner */}
      <div className={`p-6 rounded-xl border ${
        riskConfig.emergencyStopActivated 
          ? 'bg-red-950/40 border-red-700 text-white' 
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              riskConfig.emergencyStopActivated ? 'bg-red-600' : 'bg-slate-800'
            }`}>
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Sistema de Parada de Emergência (Kill-Switch)
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  riskConfig.emergencyStopActivated ? 'bg-red-600 text-white font-bold' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}>
                  {riskConfig.emergencyStopActivated ? 'BLOQUEIO TOTAL ATIVO' : 'SISTEMA OPERACIONAL'}
                </span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-sans">
                O acionamento da parada de emergência congela <strong>instantaneamente</strong> o envio de quaisquer novas ordens de trading pelo motor e pelos agentes de IA. O encerramento das posições abertas é uma ação estritamente separada.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onToggleEmergencyStop}
              className={`px-6 py-3 rounded-lg font-bold text-xs font-mono transition-colors shadow-lg cursor-pointer whitespace-nowrap ${
                riskConfig.emergencyStopActivated
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
              }`}
            >
              {riskConfig.emergencyStopActivated ? 'DESATIVAR PARADA DE EMERGÊNCIA' : 'PARAR TODAS AS OPERAÇÕES'}
            </button>

            {positions.length > 0 && (
              <button
                onClick={() => setShowCloseAllConfirm(true)}
                className="px-4 py-3 rounded-lg font-bold text-xs font-mono bg-slate-800 hover:bg-rose-900/80 text-rose-300 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Encerrar Todas as Posições ({positions.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Closing All Positions */}
      {showCloseAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirmação: Encerrar Todas as Posições</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Você está prestes a liquidar imediatamente todas as <strong>{positions.length} posições abertas</strong> a preço de mercado simulado com aplicação de spread e taxa de corretagem.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCloseAllConfirm(false)}
                className="px-4 py-2 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onCloseAllPositions();
                  setShowCloseAllConfirm(false);
                }}
                className="px-4 py-2 text-xs font-mono font-bold rounded bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              >
                Sim, Encerrar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deterministic Hard Limits Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Deterministic Rules Config */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Regras Determinísticas de Proteção de Capital
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Valores programados em código inviolável pela IA generativa.
            </p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Rule 1: Max Risk per trade */}
            <div className="flex items-center justify-between p-3 rounded bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Risco Máximo por Operação</span>
                <span className="text-[10px] text-slate-400">Limite de perda unitária planejada</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold text-sm">0.50%</span>
                <span className="text-[10px] text-slate-500 block">do Patrimônio</span>
              </div>
            </div>

            {/* Rule 2: Daily Loss Limit */}
            <div className="flex items-center justify-between p-3 rounded bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Limite de Perda Diária</span>
                <span className="text-[10px] text-slate-400">Trava automática de novas ordens</span>
              </div>
              <div className="text-right">
                <span className="text-rose-400 font-bold text-sm">2.00%</span>
                <span className="text-[10px] text-slate-500 block">-${dailyLossLimitUSD.toFixed(2)}</span>
              </div>
            </div>

            {/* Rule 3: Weekly Loss Limit */}
            <div className="flex items-center justify-between p-3 rounded bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Limite de Perda Semanal</span>
                <span className="text-[10px] text-slate-400">Bloqueio até o início da próxima semana</span>
              </div>
              <div className="text-right">
                <span className="text-rose-400 font-bold text-sm">5.00%</span>
                <span className="text-[10px] text-slate-500 block">-${weeklyLossLimitUSD.toFixed(2)}</span>
              </div>
            </div>

            {/* Rule 4: Max Exposure per Asset */}
            <div className="flex items-center justify-between p-3 rounded bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Exposição Máxima por Ativo</span>
                <span className="text-[10px] text-slate-400">Concentração máxima em 1 instrumento</span>
              </div>
              <div className="text-right">
                <span className="text-indigo-400 font-bold text-sm">10.00%</span>
                <span className="text-[10px] text-slate-500 block">do Patrimônio</span>
              </div>
            </div>

            {/* Rule 5: Leverage strictly disabled */}
            <div className="flex items-center justify-between p-3 rounded bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Alavancagem & Derivativos</span>
                <span className="text-[10px] text-slate-400">Restrição regulatória e segurança</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold text-sm">DESABILITADA (1x)</span>
                <span className="text-[10px] text-slate-500 block">Operações Spot</span>
              </div>
            </div>

            {/* Rule 6: Mandatory Stop Loss */}
            <div className="flex items-center justify-between p-3 rounded bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Stop-Loss Obrigatório</span>
                <span className="text-[10px] text-slate-400">Toda ordem sem stop é rejeitada</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold text-sm">OBRIGATÓRIO</span>
                <span className="text-[10px] text-slate-500 block">Rejeição Automática</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Risk Monitor Gauges */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Monitor em Tempo Real de Drawdown & Exposição
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Acompanhamento contínuo dos limites para prevenir perdas superiores ao stop.
            </p>
          </div>

          {/* Daily Drawdown Meter */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Consumo da Perda Diária Permitida:</span>
              <span className="text-white font-bold">{dailyLossProgressPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all ${
                  dailyLossProgressPct > 80 ? 'bg-rose-500' : dailyLossProgressPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, dailyLossProgressPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Perda Hoje: ${dailyLossCurrentUSD.toFixed(2)}</span>
              <span>Teto Máx: ${dailyLossLimitUSD.toFixed(2)}</span>
            </div>
          </div>

          {/* Current Asset Exposure */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Exposição Total Atual:</span>
              <span className="text-white font-bold">{totalExposurePct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${Math.min(100, totalExposurePct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Capital Alocado: ${totalExposure.toFixed(2)}</span>
              <span>Patrimônio: ${equityUSD.toFixed(2)}</span>
            </div>
          </div>

          {/* Anti-Martingale & Averaging Down Notice */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
            <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Proibição de Preço Médio em Posições Perdedoras
            </span>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              O motor rejeita expressamente qualquer ordem de compra adicional no mesmo ativo caso a posição existente esteja com PnL negativo, prevenindo a ampliação do risco por impulsos emocionais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
