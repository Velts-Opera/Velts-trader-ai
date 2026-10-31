import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  BrainCircuit,
  Sliders,
  History,
  ShieldCheck,
  BookOpen,
  ClipboardList,
} from 'lucide-react';

export type NavTab = 
  | 'overview'
  | 'markets'
  | 'agents'
  | 'strategies'
  | 'backtesting'
  | 'risk'
  | 'trader_skills'
  | 'orders';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  openPositionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openPositionsCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'markets', label: 'Mercados', icon: TrendingUp },
    { id: 'agents', label: 'Agentes de IA', icon: BrainCircuit },
    { id: 'strategies', label: 'Estratégias', icon: Sliders },
    { id: 'backtesting', label: 'Backtesting', icon: History },
    { id: 'risk', label: 'Gerenciador de Risco', icon: ShieldCheck },
    { id: 'trader_skills', label: 'Trader Skills (Repo)', icon: BookOpen },
    { id: 'orders', label: 'Operações & Ordens', icon: ClipboardList },
  ];

  return (
    <aside className="w-64 bg-[#0B0E14] border-r border-[#1E293B] flex flex-col justify-between p-3 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Terminal de Controle
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#111722]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
              {item.id === 'overview' && openPositionsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                  {openPositionsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Institutional System Status Footer */}
      <div className="p-3 bg-[#111722] border border-[#1E293B] rounded-md space-y-2 text-[11px]">
        <div className="flex items-center justify-between text-slate-400">
          <span>Motor Quantitativo</span>
          <span className="text-emerald-400 font-mono">100% Determinístico</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>IA Gemini</span>
          <span className="text-cyan-400 font-mono">5 Agentes Ativos</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Ambiente</span>
          <span className="text-amber-400 font-mono font-semibold">Simulação Segura</span>
        </div>
      </div>
    </aside>
  );
};
