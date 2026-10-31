import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, X } from 'lucide-react';

interface LiveActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLive: boolean;
  onConfirmLiveToggle: (enabled: boolean) => void;
}

export const LiveActivationModal: React.FC<LiveActivationModalProps> = ({
  isOpen,
  onClose,
  isLive,
  onConfirmLiveToggle,
}) => {
  const [step1, setStep1] = useState(false); // Broker auth
  const [step2, setStep2] = useState(false); // Sandbox test completion
  const [step3, setStep3] = useState(false); // Risk verification
  const [step4, setStep4] = useState(false); // Explicit owner signed confirmation
  const [step5, setStep5] = useState(false); // Financial limits set
  const [step6, setStep6] = useState(false); // Manual operator switch

  const [ownerSignature, setOwnerSignature] = useState('');

  if (!isOpen) return null;

  const allChecksPassed = step1 && step2 && step3 && step4 && step5 && step6 && ownerSignature.trim().length > 3;

  const handleActivate = () => {
    if (!allChecksPassed) return;
    onConfirmLiveToggle(true);
    onClose();
  };

  const handleRevertToPaper = () => {
    onConfirmLiveToggle(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Protocolo de Segurança para Operações Reais (LIVE)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-300">
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300">Aviso Institucional de Risco Financeiro</span>
              <p className="text-slate-300 leading-relaxed">
                O VELTS TRADER AI opera por padrão estritamente em <strong>PAPER TRADING</strong>. A transição para operações com dinheiro real requer a satisfação integral dos 6 critérios de segurança abaixo descritos na Seção 15 do projeto.
              </p>
            </div>
          </div>

          {/* 6 Step Checklist */}
          <div className="space-y-3 font-mono">
            {/* Step 1 */}
            <label className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={step1}
                onChange={(e) => setStep1(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500"
              />
              <div>
                <span className="font-bold text-white">1. Integração Autenticada com Corretora</span>
                <p className="text-slate-400 text-[11px] font-sans mt-0.5">
                  Credenciais de API armazenadas com segurança no backend e conectividade validada com Interactive Brokers / Binance.
                </p>
              </div>
            </label>

            {/* Step 2 */}
            <label className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={step2}
                onChange={(e) => setStep2(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500"
              />
              <div>
                <span className="font-bold text-white">2. Testes Completos no Sandbox</span>
                <p className="text-slate-400 text-[11px] font-sans mt-0.5">
                  Ciclo completo de ordens, reconciliação de saldo, slippage e preenchimento de teste executado sem falhas.
                </p>
              </div>
            </label>

            {/* Step 3 */}
            <label className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={step3}
                onChange={(e) => setStep3(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500"
              />
              <div>
                <span className="font-bold text-white">3. Verificação Determinística de Riscos</span>
                <p className="text-slate-400 text-[11px] font-sans mt-0.5">
                  Hard limits programados: Stop-loss obrigatório, max 0.5% risco por operação e perda diária travada em 2%.
                </p>
              </div>
            </label>

            {/* Step 4 */}
            <label className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={step4}
                onChange={(e) => setStep4(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500"
              />
              <div>
                <span className="font-bold text-white">4. Confirmação Explícita do Proprietário</span>
                <p className="text-slate-400 text-[11px] font-sans mt-0.5">
                  Declaração expressa de ciência dos riscos de mercado, spreads e slippage sem promessa de rentabilidade garantida.
                </p>
              </div>
            </label>

            {/* Step 5 */}
            <label className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={step5}
                onChange={(e) => setStep5(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500"
              />
              <div>
                <span className="font-bold text-white">5. Definição Prévia de Limites Financeiros</span>
                <p className="text-slate-400 text-[11px] font-sans mt-0.5">
                  Teto máximo de patrimônio exposto em operações ativas fixado e bloqueio para aumentos sem nova autorização.
                </p>
              </div>
            </label>

            {/* Step 6 */}
            <label className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={step6}
                onChange={(e) => setStep6(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500"
              />
              <div>
                <span className="font-bold text-white">6. Habilitação Manual por Operador Humano</span>
                <p className="text-slate-400 text-[11px] font-sans mt-0.5">
                  Chave física de acionamento deliberada. O sistema não ativa o modo LIVE de forma autônoma.
                </p>
              </div>
            </label>
          </div>

          {/* Owner Signature Input */}
          <div className="pt-2">
            <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">
              Assinatura do Proprietário (Digite seu nome completo):
            </label>
            <input
              type="text"
              placeholder="Ex: Carlos Veltrani"
              value={ownerSignature}
              onChange={(e) => setOwnerSignature(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              onClick={handleRevertToPaper}
              className="px-4 py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              Manter em Paper Trading
            </button>

            <button
              onClick={handleActivate}
              disabled={!allChecksPassed}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded transition-colors ${
                allChecksPassed
                  ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                  : 'bg-slate-800/80 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ATIVAR MODO LIVE (CONTA REAL)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
