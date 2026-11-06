import React, { useState, useEffect } from 'react';
import { AuditLogEntry, INSTITUTIONAL_SECURITY_POLICY } from '../../core/security';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  FileCheck2, 
  AlertTriangle, 
  RefreshCw, 
  Building2, 
  Cpu, 
  Layers,
  CheckCircle2,
  XCircle,
  Database,
  FileCode2,
  Copy,
  Check
} from 'lucide-react';

export const SecurityCenterTab: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [showSqlViewer, setShowSqlViewer] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/security/audit-trail');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch audit trail from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const brokerConnections = [
    {
      name: 'Interactive Brokers (TWS / Gateway)',
      assetType: 'Ações US, ETFs, Forex Spot',
      authMethod: 'OAuth 2.0 / Client TLS mTLS',
      status: 'NÃO CONECTADO',
      keyStorage: 'Não configurado',
      readOnly: true,
      withdrawalsDisabled: true,
    },
    {
      name: 'Binance Institutional Spot',
      assetType: 'Criptomoedas Spot (BTC, ETH, SOL)',
      authMethod: 'HMAC-SHA256 Encrypted Sign',
      status: 'API PÚBLICA / SEM CHAVE',
      keyStorage: 'Não necessário para market data',
      readOnly: true,
      withdrawalsDisabled: true,
    },
    {
      name: 'Banco Central / Open Finance Gateway',
      assetType: 'Cotações de Câmbio & Liquidação EUR/USD',
      authMethod: 'B2B Certificate Authentication',
      status: 'NÃO CONECTADO',
      keyStorage: 'Não configurado',
      readOnly: true,
      withdrawalsDisabled: true,
    },
  ];

  const complianceItems = [
    { rule: 'Segregação de Ambientes', desc: 'Separação estrita entre Paper Trading (Sandbox) e Live Trading (Produção).' },
    { rule: 'Air-Gap de Inteligência Artificial', desc: 'Modelos generativos (Gemini) nunca têm posse de chaves privadas ou permissão de saque.' },
    { rule: 'Chaves Somente-Leitura (Read-Only / Trade-Only)', desc: 'Chaves de API sem privilégio de saque (Withdrawal Prohibited by Design).' },
    { rule: 'Proteção Anti-Replay & Idempotência', desc: 'Tokens únicos por ordem impedem envios duplicados ou ataques de repetição.' },
    { rule: 'Rate Limiting Institucional', desc: 'Limite de 60 requisições por minuto para prevenir falhas em loop e flash crashes.' },
    { rule: 'Isolamento Multi-Tenant (RLS PostgreSQL)', desc: 'Políticas RLS estão definidas no schema; a aplicação no projeto Supabase deve ser validada no banco.' },
    { rule: 'Trilha de Auditoria', desc: 'Logs encadeados em memória nesta versão; persistência externa precisa ser confirmada por ambiente.' },
  ];

  const filteredLogs = auditLogs.filter(log => {
    if (filterSeverity === 'ALL') return true;
    return log.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Hero Security Status Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Centro de Segurança Institucional & Integrações Bancárias
                </h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                  CONTROLES EM DESENVOLVIMENTO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
                Estado real das proteções implementadas e das integrações ainda não conectadas. Nenhuma certificação ou conexão é presumida.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Criptografia do Cofre</span>
              <span className="text-white font-bold">NÃO CONFIGURADO</span>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Banking Defense */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 font-mono text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Lock className="w-4 h-4" />
              <span>Zero-Plaintext Frontend</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              Nenhuma chave de API ou segredo de corretora trafega ou é exposto no navegador.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>Air-Gap dos Modelos de IA</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              O Gemini delibera estratégias, mas a máquina determinística valida os limites de risco.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Layers className="w-4 h-4" />
              <span>Anti-Replay / Idempotência</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              Tokens com nonce único bloqueiam requisições duplicadas ou ataques de repetição.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <FileCheck2 className="w-4 h-4" />
              <span>Saques Desabilitados</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              Nenhuma chave privada de corretora está configurada nesta versão.
            </p>
          </div>
        </div>
      </div>

      {/* Broker Vault Integration Status */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Cofre de Conexões com Corretoras & Gateways Bancários
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Status das integrações protegidas pelo backend.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded">
            Sem cofre de corretora configurado
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Instituição / Conector</th>
                <th className="px-6 py-3">Instrumentos</th>
                <th className="px-6 py-3">Protocolo de Autenticação</th>
                <th className="px-6 py-3">Permissão de Saque</th>
                <th className="px-6 py-3 text-center">Status Sandbox</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {brokerConnections.map((conn, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="px-6 py-3 font-bold text-white">{conn.name}</td>
                  <td className="px-6 py-3 text-slate-300">{conn.assetType}</td>
                  <td className="px-6 py-3 text-indigo-400">{conn.authMethod}</td>
                  <td className="px-6 py-3">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> NÃO APLICÁVEL
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                      {conn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Controls & Immutable Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: Compliance Checklist */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Controles de Auditoria Bancária
            </h3>
            <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
              Controles técnicos internos; sem certificação SOC 2/Open Finance
            </span>
          </div>

          <div className="space-y-3">
            {complianceItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-white font-mono text-xs block">{item.rule}</span>
                  <p className="text-[11px] text-slate-400 font-sans leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Database Schema & RLS Action */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowSqlViewer(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Ver Esquema PostgreSQL & RLS (DDL)
            </button>
            <span className="text-[10px] text-slate-500 font-mono text-center block mt-1.5">
              Arquivo: src/lib/databaseSchema.sql
            </span>
          </div>
        </div>

        {/* Right 2 cols: Live Immutable Audit Trail */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Trilha de Auditoria do Servidor
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cada evento recebe assinatura encadeada em memória; reiniciar o servidor reinicia essa trilha.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchAuditLogs}
                disabled={loading}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                title="Atualizar Logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[10px] uppercase">Filtrar:</span>
            {['ALL', 'INFO', 'WARN', 'CRITICAL'].map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                  filterSeverity === sev ? 'bg-slate-800 text-white font-bold' : 'text-slate-500 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredLogs.map(log => (
              <div key={log.id} className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      log.severity === 'WARN' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {log.severity}
                    </span>
                    <span className="font-bold text-white">{log.eventType}</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>

                <p className="text-slate-300 font-sans text-xs">
                  {log.details?.message || JSON.stringify(log.details)}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-900">
                  <span>Ator: <strong className="text-slate-400">{log.actor}</strong></span>
                  <span className="text-slate-600 font-mono">Hash: {log.signature}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SQL Schema & RLS Modal */}
      {showSqlViewer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-700/60">
                  <Database className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    Esquema PostgreSQL & RLS (Supabase)
                    <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                      RLS ATIVO
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    src/lib/databaseSchema.sql - Multi-tenant isolation por auth.uid()
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`-- VELTS TRADER AI - PostgreSQL Schema
-- Ver arquivo completo em: src/lib/databaseSchema.sql
-- Tabelas: users, orders, positions, market_data, audit_logs`);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={() => setShowSqlViewer(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Tabelas Criadas</span>
                  <span className="text-white font-bold text-sm">users, orders, positions, market_data, audit_logs</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Isolamento Multi-Tenant</span>
                  <span className="text-emerald-400 font-bold text-sm">auth.uid() = user_id</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Integridade de Auditoria</span>
                  <span className="text-amber-400 font-bold text-sm">Sem UPDATE / Sem DELETE</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed">
                <pre className="text-indigo-300">{`-- Resumo das Políticas de Isolamento (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Ordens Isoladas por Usuário
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_own" ON orders FOR UPDATE USING (auth.uid() = user_id);

-- 2. Posições Isoladas
CREATE POLICY "positions_select_own" ON positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "positions_update_own" ON positions FOR UPDATE USING (auth.uid() = user_id);

-- 3. Cotações de Mercado (Leitura pública, escrita apenas service_role)
CREATE POLICY "market_data_select_public" ON market_data FOR SELECT USING (TRUE);

-- 4. Trilha de Auditoria (Imutável: somente INSERT e SELECT)
CREATE POLICY "audit_logs_select_own" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audit_logs_insert_own" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
-- Proibição intencional de UPDATE e DELETE para garantir integridade bancária`}</pre>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <span>O arquivo completo inclui gatilhos de <code className="text-indigo-400">updated_at</code>, índices em <code className="text-indigo-400">(user_id, created_at)</code> e gancho de auth <code className="text-indigo-400">handle_new_user()</code>.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
