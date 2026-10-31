import React, { useState } from 'react';
import { MarketAsset, MarketCategory } from '../../types/trading';
import { generateOrderBook } from '../../services/marketData';
import { Search, TrendingUp, TrendingDown, Bot, PlusCircle } from 'lucide-react';

interface MarketsTabProps {
  assets: MarketAsset[];
  onSelectAsset: (asset: MarketAsset) => void;
  onOpenTradeModal: (asset: MarketAsset) => void;
  onAnalyzeAssetWithAI: (asset: MarketAsset) => void;
}

export const MarketsTab: React.FC<MarketsTabProps> = ({
  assets,
  onSelectAsset,
  onOpenTradeModal,
  onAnalyzeAssetWithAI,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedAsset, setInspectedAsset] = useState<MarketAsset>(assets[0]);

  const categories: { id: MarketCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Todos os Mercados' },
    { id: 'crypto', label: 'Criptomoedas (Spot)' },
    { id: 'us_stocks', label: 'Mercado Americano (US)' },
    { id: 'european', label: 'Mercado Europeu (EUR)' },
    { id: 'forex', label: 'Forex (Moedas)' },
  ];

  const filteredAssets = assets.filter((asset) => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch =
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const orderBook = generateOrderBook(inspectedAsset.price, inspectedAsset.decimalPlaces);

  return (
    <div className="space-y-6">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Interactive segmented category tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar ativo ou símbolo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-slate-700 focus:outline-hidden font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 cols: Multi-market table */}
        <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Cotações em Tempo Real ({filteredAssets.length} Ativos)
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Spread & Liquidez Spot</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Símbolo / Nome</th>
                  <th className="px-4 py-2.5">Mercado</th>
                  <th className="px-4 py-2.5 text-right">Preço</th>
                  <th className="px-4 py-2.5 text-right">Var 24h</th>
                  <th className="px-4 py-2.5 text-right">Spread</th>
                  <th className="px-4 py-2.5 text-right">Mín / Máx 24h</th>
                  <th className="px-4 py-2.5 text-center">Operações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.symbol}
                    onClick={() => {
                      setInspectedAsset(asset);
                      onSelectAsset(asset);
                    }}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      inspectedAsset.symbol === asset.symbol ? 'bg-slate-800/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{asset.symbol}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{asset.name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 uppercase text-[10px]">
                      {asset.category.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white tabular-nums">
                      {asset.currency === 'USD' ? '$' : '€'}
                      {asset.price.toFixed(asset.decimalPlaces)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {asset.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">
                      ${asset.spread.toFixed(asset.decimalPlaces)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-[11px] tabular-nums">
                      {asset.low24h.toFixed(asset.decimalPlaces)} - {asset.high24h.toFixed(asset.decimalPlaces)}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onAnalyzeAssetWithAI(asset)}
                          title="Analisar com os 5 Agentes de IA"
                          className="p-1.5 rounded bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenTradeModal(asset)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Negociar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 col: Order Book Depth Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Livro de Ofertas (Depth)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">{inspectedAsset.symbol}</span>
          </div>

          <div className="space-y-3 font-mono text-[11px]">
            {/* Asks (Venda) */}
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase">Ordens de Venda (Asks)</span>
              {orderBook.asks.slice(-4).reverse().map((ask, i) => (
                <div key={i} className="flex justify-between text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded">
                  <span>${ask.price.toFixed(inspectedAsset.decimalPlaces)}</span>
                  <span className="text-slate-400">{ask.amount}</span>
                  <span className="text-slate-500">${ask.total}</span>
                </div>
              ))}
            </div>

            {/* Mid Price */}
            <div className="py-1 px-2 bg-slate-800 rounded text-center font-bold text-white text-xs">
              ${inspectedAsset.price.toFixed(inspectedAsset.decimalPlaces)}
              <span className="text-[10px] text-slate-400 font-normal ml-2">Spread: ${inspectedAsset.spread}</span>
            </div>

            {/* Bids (Compra) */}
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase">Ordens de Compra (Bids)</span>
              {orderBook.bids.slice(0, 4).map((bid, i) => (
                <div key={i} className="flex justify-between text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded">
                  <span>${bid.price.toFixed(inspectedAsset.decimalPlaces)}</span>
                  <span className="text-slate-400">{bid.amount}</span>
                  <span className="text-slate-500">${bid.total}</span>
                </div>
              ))}
            </div>

            {/* Direct Trade CTA */}
            <div className="pt-2">
              <button
                onClick={() => onOpenTradeModal(inspectedAsset)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Emitir Ordem para {inspectedAsset.symbol}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
