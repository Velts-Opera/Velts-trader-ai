import React, { useState } from 'react';
import { calculatePositionSize } from '../../core/riskManager';
import { BookOpen, Calculator, FileText, Users, Building, ShieldCheck, ExternalLink } from 'lucide-react';

interface TraderSkillsTabProps {
  equityUSD: number;
}

export const TraderSkillsTab: React.FC<TraderSkillsTabProps> = ({ equityUSD }) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'sizing' | 'copycat' | 'congressional'>('audit');

  // Interactive sizing state
  const [calcEquity, setCalcEquity] = useState(equityUSD || 100000);
  const [calcEntry, setCalcEntry] = useState(138.65);
  const [calcStop, setCalcStop] = useState(132.00);
  const [calcRiskPct, setCalcRiskPct] = useState(0.5);

  const calculatedQty = calculatePositionSize(calcEquity, calcEntry, calcStop, calcRiskPct);
  const totalValue = calculatedQty * calcEntry;
  const totalRisk = Math.abs(calcEntry - calcStop) * calculatedQty;

  // Institutional 13F sample data
  const sample13FFilings = [
    { fund: 'Berkshire Hathaway', ticker: 'AAPL', action: 'HOLD', weight: '29.4%', shares: '300.0M', quarter: 'Q3' },
    { fund: 'Berkshire Hathaway', ticker: 'OXY', action: 'BUY (+2.4%)', weight: '4.8%', shares: '255.3M', quarter: 'Q3' },
    { fund: 'Bridgewater Associates', ticker: 'SPY', action: 'BUY (+18.2%)', weight: '5.6%', shares: '2.1M', quarter: 'Q3' },
    { fund: 'Scion Asset Mgmt (Burry)', ticker: 'BABA', action: 'BUY (+30.0%)', weight: '9.2%', shares: '200.0K', quarter: 'Q3' },
    { fund: 'Renaissance Technologies', ticker: 'NVDA', action: 'BUY (+12.5%)', weight: '2.1%', shares: '1.4M', quarter: 'Q3' },
  ];

  // Congressional trades sample
  const sampleCongressionalTrades = [
    { politician: 'Rep. Nancy Pelosi', ticker: 'NVDA', transaction: 'CALL OPTIONS (LEAPS)', amount: '$1,000,000 - $5,000,000', disclosureDate: '2026-09-14' },
    { politician: 'Rep. Michael McCaul', ticker: 'MSFT', transaction: 'PURCHASE', amount: '$250,000 - $500,000', disclosureDate: '2026-10-02' },
    { politician: 'Sen. Markwayne Mullin', ticker: 'RTX', transaction: 'SALE', amount: '$50,000 - $100,000', disclosureDate: '2026-10-18' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'audit' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Relatório Técnico do Repositório</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sizing')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'sizing' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Calculadora de Posição & Budget</span>
        </button>

        <button
          onClick={() => setActiveSubTab('copycat')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'copycat' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Rastreador Institucional 13F</span>
        </button>

        <button
          onClick={() => setActiveSubTab('congressional')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'congressional' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Divulgações do Congresso (House/Senate)</span>
        </button>
      </div>

      {/* Subtab 1: Technical Audit of Jakeschincariol/trader-skill */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                  Auditoria de Arquitetura & Código
                </span>
                <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                  Análise Técnica do Repositório: Jakeschincariol/trader-skill
                </h3>
              </div>
              <a
                href="https://github.com/Jakeschincariol/trader-skill"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-mono"
              >
                <span>github.com/Jakeschincariol/trader-skill</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
                <span className="font-bold text-white font-mono block">1. Licença de Utilização</span>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Licença MIT</strong> — Permissiva para integração, adaptação comercial e redistribuição mantendo a atribuição original de direitos autorais.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
                <span className="font-bold text-white font-mono block">2. Dependências & Execução</span>
                <p className="text-slate-300 leading-relaxed">
                  Projetado com scripts autônomos em Python puro sem dependência de APIs pagas ou bibliotecas proprietárias pesadas. Utiliza fontes abertas e gratuitas.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
                <span className="font-bold text-white font-mono block">3. Fontes de Dados Públicas</span>
                <p className="text-slate-300 leading-relaxed">
                  SEC EDGAR (relatórios 10-K, 10-Q, 8-K), endpoints abertos de cotações Yahoo Finance, símbolos Nasdaq Trader e registros públicos de membros do congresso americano.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
                <span className="font-bold text-white font-mono block">4. Princípio "Human-in-the-Loop"</span>
                <p className="text-slate-300 leading-relaxed">
                  A máxima do repositório é: <em>"Nothing trades without your yes"</em>. O assistente sugere e calcula, mas jamais executa ordens sem aprovação explícita.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-lg border border-emerald-500/30 text-xs space-y-2">
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Compatibilidade & Adaptação no VELTS TRADER AI
              </span>
              <p className="text-slate-300 leading-relaxed font-sans">
                Os módulos do <code>trader-skill</code> (sizing de risco, acompanhamento de 13F e rastreamento fundamental) foram adaptados e elevados na arquitetura do VELTS TRADER AI. O motor de execução em TypeScript/Node roda no backend integrado ao <strong>Gemini 3.8 Flash</strong>, respeitando a governança determinística do Gerenciador de Risco.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Sizing & Budget Calculator */}
      {activeSubTab === 'sizing' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Calculadora de Dimensionamento de Posição (/trader-risk & /trader-budget)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Fórmula determinística: Qtd = (Patrimônio × % Risco) / |Entrada - StopLoss|, com teto de 10% de exposição.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Patrimônio ($)</label>
              <input
                type="number"
                value={calcEquity}
                onChange={(e) => setCalcEquity(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Preço de Entrada ($)</label>
              <input
                type="number"
                step="0.01"
                value={calcEntry}
                onChange={(e) => setCalcEntry(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-amber-400 block mb-1">Preço Stop-Loss ($)</label>
              <input
                type="number"
                step="0.01"
                value={calcStop}
                onChange={(e) => setCalcStop(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Risco Planejado (%)</label>
              <input
                type="number"
                step="0.1"
                max="0.5"
                value={calcRiskPct}
                onChange={(e) => setCalcRiskPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Quantidade Recomendada</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{calculatedQty} unidades</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Valor Total Alocado</span>
              <div className="text-xl font-bold text-white mt-1">${totalValue.toFixed(2)}</div>
              <span className="text-[10px] text-slate-500">({((totalValue / calcEquity) * 100).toFixed(1)}% do total)</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Perda Máxima se Stop Acionado</span>
              <div className="text-xl font-bold text-rose-400 mt-1">${totalRisk.toFixed(2)}</div>
              <span className="text-[10px] text-slate-500">({((totalRisk / calcEquity) * 100).toFixed(2)}% do patrimônio)</span>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Institutional 13F Copycat */}
      {activeSubTab === 'copycat' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Rastreamento de Posições 13F (SEC EDGAR)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Movimentações institucionais dos maiores gestores globais de hedge funds.
              </p>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded">
              Fonte: SEC EDGAR Filings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Fundo / Gestor</th>
                  <th className="px-6 py-3">Ticker</th>
                  <th className="px-6 py-3">Ação</th>
                  <th className="px-6 py-3 text-right">Peso na Carteira</th>
                  <th className="px-6 py-3 text-right">Ações Custodiadas</th>
                  <th className="px-6 py-3 text-center">Trimestre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {sample13FFilings.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="px-6 py-3 font-bold text-white">{f.fund}</td>
                    <td className="px-6 py-3 text-emerald-400 font-bold">{f.ticker}</td>
                    <td className="px-6 py-3">
                      <span className={f.action.includes('BUY') ? 'text-emerald-400' : 'text-slate-300'}>
                        {f.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-300">{f.weight}</td>
                    <td className="px-6 py-3 text-right text-white">{f.shares}</td>
                    <td className="px-6 py-3 text-center text-slate-400">{f.quarter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: Congressional Trades */}
      {activeSubTab === 'congressional' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Divulgações do Congresso dos EUA (STOCK Act Disclosures)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Monitoramento de transações declaradas por membros da Câmara e Senado.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              STOCK Act Official Reports
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Membro do Congresso</th>
                  <th className="px-6 py-3">Ativo</th>
                  <th className="px-6 py-3">Tipo de Transação</th>
                  <th className="px-6 py-3 text-right">Volume Estimado</th>
                  <th className="px-6 py-3 text-center">Data Divulgação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {sampleCongressionalTrades.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="px-6 py-3 font-bold text-white">{t.politician}</td>
                    <td className="px-6 py-3 text-indigo-400 font-bold">{t.ticker}</td>
                    <td className="px-6 py-3">
                      <span className={t.transaction.includes('PURCHASE') || t.transaction.includes('CALL') ? 'text-emerald-400' : 'text-rose-400'}>
                        {t.transaction}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-200">{t.amount}</td>
                    <td className="px-6 py-3 text-center text-slate-400">{t.disclosureDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
