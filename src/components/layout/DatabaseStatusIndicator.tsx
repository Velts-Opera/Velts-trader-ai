import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { 
  isSupabaseConfigured, 
  getDatabaseStatus, 
  checkSupabaseHealth, 
  SupabaseHealthResult 
} from '../../lib/supabase';

interface DatabaseStatusIndicatorProps {
  setActiveTab: (tab: string) => void;
}

export const DatabaseStatusIndicator: React.FC<DatabaseStatusIndicatorProps> = ({ setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [health, setHealth] = useState<SupabaseHealthResult>({
    status: isSupabaseConfigured ? 'checking' : 'unconfigured',
    message: isSupabaseConfigured 
      ? 'Verificando conexão com o Cloud PostgreSQL...' 
      : 'Supabase não configurado. Modo Paper Trading local ativo.',
    checkedAt: Date.now(),
  });
  const [isChecking, setIsChecking] = useState(false);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const res = await checkSupabaseHealth();
      setHealth(res);
    } catch {
      setHealth({
        status: 'error',
        message: 'Falha ao contatar endpoint do banco de dados.',
        checkedAt: Date.now(),
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dbInfo = getDatabaseStatus();

  return (
    <div className="relative">
      {/* Visual Header Trigger Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium rounded border transition-all cursor-pointer select-none ${
          health.status === 'connected'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50'
            : health.status === 'error'
            ? 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/60'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/60'
        }`}
        title={
          health.status === 'connected'
            ? 'Supabase Conectado ao Cloud PostgreSQL (Clique para detalhes)'
            : 'Supabase Pendente de Configuração (Clique para configurar)'
        }
      >
        <Database className="w-3.5 h-3.5 shrink-0" />
        
        {/* Pulsing Status Dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          {health.status === 'connected' ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : health.status === 'error' ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </>
          )}
        </span>

        {/* Dynamic Label */}
        <span className="whitespace-nowrap">
          {health.status === 'connected' ? (
            <>
              <span className="hidden sm:inline">SUPABASE: </span>
              <span className="font-bold text-emerald-400">CONECTADO</span>
            </>
          ) : health.status === 'error' ? (
            <>
              <span className="hidden sm:inline">SUPABASE: </span>
              <span className="font-bold text-rose-400">ERRO</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">SUPABASE: </span>
              <span className="font-bold text-amber-300">CONFIGURAR</span>
            </>
          )}
        </span>

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover / Status & Configuration Dialog */}
      {isOpen && (
        <>
          {/* Backdrop for easy closing */}
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-4 text-xs font-sans animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${
                  health.status === 'connected'
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400'
                    : 'bg-amber-950/80 border-amber-700 text-amber-400'
                }`}>
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    Banco de Dados
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold border ${
                      health.status === 'connected'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}>
                      {health.status === 'connected' ? 'Cloud Online' : 'Modo Local (Paper)'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Provedor: {dbInfo.provider}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Feedback Block */}
            <div className="my-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">Status da Conexão:</span>
                <span className={`font-mono font-bold flex items-center gap-1 ${
                  health.status === 'connected' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {health.status === 'connected' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Ativa ({health.latencyMs ?? 15}ms)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Aguardando Configuração
                    </>
                  )}
                </span>
              </div>

              {health.status === 'connected' && dbInfo.maskedHost && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">Endpoint:</span>
                  <span className="font-mono text-slate-300 font-bold truncate max-w-[180px]">
                    {dbInfo.maskedHost}
                  </span>
                </div>
              )}

              <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1 border-t border-slate-800/80">
                {health.message}
              </p>
            </div>

            {/* If NOT connected: Guidance & Variables for Configuration */}
            {health.status !== 'connected' ? (
              <div className="space-y-3">
                <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-2.5 text-[11px] text-amber-200/90 leading-relaxed">
                  <strong className="block text-amber-300 font-semibold mb-1">
                    Como conectar o seu Supabase:
                  </strong>
                  Defina as duas variáveis abaixo no painel de ambiente do Google AI Studio ou no seu arquivo <code className="text-white font-mono bg-amber-950/80 px-1 py-0.5 rounded">.env</code>:
                </div>

                {/* Environment Variables Copy Cards */}
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Nome da Variável 1</span>
                      <span className="text-indigo-300 font-bold">VITE_SUPABASE_URL</span>
                    </div>
                    <button
                      onClick={() => handleCopy('VITE_SUPABASE_URL', 'url_key')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
                      title="Copiar nome da variável"
                    >
                      {copiedKey === 'url_key' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === 'url_key' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>

                  <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Nome da Variável 2</span>
                      <span className="text-indigo-300 font-bold">VITE_SUPABASE_ANON_KEY</span>
                    </div>
                    <button
                      onClick={() => handleCopy('VITE_SUPABASE_ANON_KEY', 'anon_key')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
                      title="Copiar nome da variável"
                    >
                      {copiedKey === 'anon_key' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === 'anon_key' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {/* 3 Quick Steps */}
                <div className="space-y-1 text-[11px] text-slate-400 pt-1">
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-bold font-mono">1</span>
                    <span>Crie seu projeto gratuito em <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">supabase.com</a></span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-bold font-mono">2</span>
                    <span>Obtenha a URL e a Anon Key em <strong>Settings ➔ API</strong></span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-bold font-mono">3</span>
                    <span>Rode o script <code className="text-emerald-400 font-mono">databaseSchema.sql</code> no SQL Editor</span>
                  </div>
                </div>
              </div>
            ) : (
              /* If connected: Security & RLS Confirmation */
              <div className="space-y-2.5">
                <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    Conexão Supabase verificada
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    O endpoint respondeu à consulta. As políticas RLS devem ser verificadas separadamente no banco antes de considerar o isolamento confirmado.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveTab('security');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 hover:text-white text-xs font-medium cursor-pointer transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ver Esquema SQL & RLS</span>
              </button>

              <button
                onClick={runHealthCheck}
                disabled={isChecking}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono cursor-pointer transition-colors"
                title="Testar ping com o Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{isChecking ? 'Checando...' : 'Testar'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
