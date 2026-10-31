import React, { useState } from 'react';
import { Order, OrderState } from '../../types/trading';
import { CheckCircle2, XCircle, Clock, ShieldAlert, FileText, ChevronRight } from 'lucide-react';

interface OrderHistoryTabProps {
  orders: Order[];
}

export const OrderHistoryTab: React.FC<OrderHistoryTabProps> = ({ orders }) => {
  const [filterState, setFilterState] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);

  const filteredOrders = orders.filter((o) => {
    if (filterState === 'ALL') return true;
    if (filterState === 'FILLED') return o.state === 'FILLED';
    if (filterState === 'REJECTED') return o.state === 'REJECTED';
    return o.state === filterState;
  });

  const getStatusBadge = (state: OrderState) => {
    switch (state) {
      case 'FILLED':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> EXECUTADA
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-rose-400 font-bold font-mono text-[11px]">
            <XCircle className="w-3.5 h-3.5" /> REJEITADA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-amber-400 font-bold font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5" /> {state}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top filter tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
          <button
            onClick={() => setFilterState('ALL')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              filterState === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({orders.length})
          </button>
          <button
            onClick={() => setFilterState('FILLED')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              filterState === 'FILLED' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Executadas ({orders.filter((o) => o.state === 'FILLED').length})
          </button>
          <button
            onClick={() => setFilterState('REJECTED')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              filterState === 'REJECTED' ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rejeitadas por Risco ({orders.filter((o) => o.state === 'REJECTED').length})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Ambiente: Paper Trading Reconciliado
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Orders table */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Livro de Ordens & Histórico
            </h3>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-slate-500">
              Nenhuma ordem encontrada para o filtro selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Horário</th>
                    <th className="px-4 py-2.5">Ativo / Lado</th>
                    <th className="px-4 py-2.5 text-right">Qtd</th>
                    <th className="px-4 py-2.5 text-right">Preço</th>
                    <th className="px-4 py-2.5 text-right">Taxa/Slip</th>
                    <th className="px-4 py-2.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        selectedOrder?.id === ord.id ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {new Date(ord.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{ord.symbol}</div>
                        <div className={ord.side === 'BUY' ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
                          {ord.side} ({ord.type})
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{ord.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold text-white tabular-nums">
                        ${ord.executedPrice ? ord.executedPrice.toFixed(2) : ord.targetPrice?.toFixed(2) ?? 'MKT'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 text-[11px] tabular-nums">
                        ${ord.fee.toFixed(2)} / ${ord.slippage.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(ord.state)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 col: Order State Machine Inspector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Auditoria de Ciclo de Vida da Ordem
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              ID: {selectedOrder ? selectedOrder.id : 'Nenhuma selecionada'}
            </span>
          </div>

          {selectedOrder ? (
            <div className="space-y-4 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Order ID:</span>
                  <span className="text-slate-200">{selectedOrder.clientOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stop-Loss Obrigatório:</span>
                  <span className="text-amber-400 font-bold">${selectedOrder.stopLossPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slippage Realizado:</span>
                  <span className="text-slate-300">${selectedOrder.slippage.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taxa de Corretagem:</span>
                  <span className="text-slate-300">${selectedOrder.fee.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.rejectionReason && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-xs">
                  <span className="font-bold block">Motivo da Rejeição:</span>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{selectedOrder.rejectionReason}</p>
                </div>
              )}

              {/* State Transition History Flow */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  Histórico de Transições da Máquina de Estados:
                </span>
                <div className="space-y-2">
                  {selectedOrder.stateHistory.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] text-indigo-400 font-bold">
                        {idx + 1}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{h.state}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(h.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {h.message && <p className="text-[11px] text-slate-400 font-sans">{h.message}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-mono">
              Selecione uma ordem na tabela ao lado para inspecionar o log completo de auditoria.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
