import React from 'react';
import { Currency } from '../../types/trading';
import { ShieldAlert, Lock, User, ShieldCheck } from 'lucide-react';
import { DatabaseStatusIndicator } from './DatabaseStatusIndicator';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  equityUSD: number;
  equityEUR: number;
  isEmergencyStop: boolean;
  onToggleEmergencyStop: () => void;
  onOpenLiveModal: () => void;
  currentUser: { email: string; name: string } | null;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  equityUSD,
  equityEUR,
  isEmergencyStop,
  onToggleEmergencyStop,
  onOpenLiveModal,
  currentUser,
  onOpenAuthModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'markets', label: 'Mercados' },
    { id: 'agents', label: 'Análise Assistida' },
    { id: 'strategies', label: 'Estratégias' },
    { id: 'backtest', label: 'Backtesting' },
    { id: 'risk', label: 'Gestão de Risco' },
    { id: 'security', label: 'Segurança & Bancos' },
    { id: 'trader_skills', label: 'Trader Skills' },
    { id: 'orders', label: 'Ordens & Logs' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14] border-b border-slate-800 px-4 xl:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3 xl:gap-5">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center font-bold text-white text-xs tracking-tighter">
            V
          </div>
          <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
            CODEXTRADER V1
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-3.5 text-xs font-medium text-slate-400">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                activeTab === item.id
                  ? 'text-white border-b-2 border-emerald-400 font-semibold'
                  : 'hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Actions & Status cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Supabase Connection Status Indicator */}
          <DatabaseStatusIndicator setActiveTab={setActiveTab} />

          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                currency === 'USD'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setCurrency('EUR')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                currency === 'EUR'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EUR
            </button>
          </div>

          {/* User Account / Login Button */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            title="Acessar conta ou perfil de operador"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline font-mono text-[11px]">
              {currentUser ? currentUser.name.split(' ')[0] : 'Entrar'}
            </span>
          </button>

          {/* Quick Equity Display */}
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">
              Patrimônio
            </span>
            <span className="text-xs font-mono font-bold text-white tabular-nums">
              {currency === 'USD'
                ? `$${equityUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `€${equityEUR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>

          {/* Paper / Live Badge */}
          <button
            onClick={onOpenLiveModal}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors whitespace-nowrap cursor-pointer"
            title="Clique para abrir requisitos de ativação do Modo Real (LIVE)"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>PAPER TRADING</span>
          </button>

          {/* Emergency Kill-Switch */}
          <button
            onClick={onToggleEmergencyStop}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition-colors whitespace-nowrap cursor-pointer ${
              isEmergencyStop
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isEmergencyStop ? 'PARADA ATIVA' : 'PARAR OPERAÇÕES'}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex xl:hidden overflow-x-auto gap-4 pt-2.5 mt-2 border-t border-slate-800/60 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap pb-1 cursor-pointer ${
              activeTab === item.id
                ? 'text-white border-b-2 border-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
