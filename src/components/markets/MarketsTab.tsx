import React, { useEffect, useState } from 'react';
import { MarketAsset, MarketCategory } from '../../types/trading';
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
  const [scan, setScan] = useState<Array<{
    symbol: string; classification: string; trend: string; rsi14: number;
    volumeRatio: number; atrPct: number; price: number; reasons: string[];
  }>>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const runScanner = async () => {
    setScanning(true);
    setScanError(null);
    setScan([]);
    try {
      const response = await fetch('/api/market/binance/scan', { cache: 'no-store' });
      if (!response.ok) throw new Error('Scanner indisponível: verifique a Binance.');
      const payload = await response.json() as { results: typeof scan };
      if (!Array.isArray(payload.results)) throw new Error('Resposta inválida do scanner.');
      setScan(payload.results);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Falha na varredura.');
    } finally {
      setScanning(false);
    }
  };
  const [inspectedAsset, setInspectedAsset] = useState<MarketAsset>(assets[0]);
  const [orderBook, setOrderBook] = useState<{
    bids: { price: number; quantity: number; notional: number }[];
    asks: { price: number; quantity: number; notional: number }[];
    asOf: number;
  } | null>(null);
  const [orderBookError, setOrderBookError] = useState<string | null>(null);

  const binancePair = inspectedAsset.symbol.replace('/', '') as 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'BNBUSDT';

  useEffect(() => {
    void runScanner();
    const id = window.setInterval(() => void runScanner(), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    const loadOrderBook = async () => {
      if (inspectedAsset.category !== 'crypto') {
        if (active) {
          setOrderBook(null);
          setOrderBookError('Profundidade real disponível apenas para os pares Binance Spot integrados.');
        }
        return;
      }
      try {
        const response = await fetch(`/api/market/binance/orderbook?symbol=${encodeURIComponent(binancePair)}&limit=20`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Profundidade Binance indisponível.');
        const payload = await response.json() as {
          bids: { price: number; quantity: number; notional: number }[];
          asks: { price: number; quantity: number; notional: number }[];
          asOf: number;
        };
        if (!Array.isArray(payload.bids) || !Array.isArray(payload.asks)) throw new Error('Resposta inválida da profundidade.');
        if (active) {
          setOrderBook(payload);
          setOrderBookError(null);
        }
      } catch (error) {
        if (active) {
          setOrderBook(null);
          setOrderBookError(error instanceof Error ? error.message : 'Falha ao carregar profundidade.');
        }
      }
    };
    void loadOrderBook();
    const id = window.setInterval(() => void loadOrderBook(), 5_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [binancePair, inspectedAsset.category]);

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


  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Scanner quantitativo Binance Spot</h2>
            <p className="text-xs text-slate-400">BTC, ETH, SOL e BNB · candles fechados de 1h · atualização automática a cada 60s</p>
          </div>
          <button onClick={() => void runScanner()} disabled={scanning}
            className="rounded bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {scanning ? 'Analisando...' : 'Varrer mercado'}
          </button>
        </div>
        {scanError && <p role="alert" className="mt-3 text-xs text-rose-400">{scanError}</p>}
        {scan.length > 0 && (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {scan.map(row => (
              <div key={row.symbol} className="rounded border border-slate-700 p-3 text-xs text-slate-300">
                <div className="flex justify-between"><strong className="text-white">{row.symbol}</strong>
                  <span>{row.classification === 'WATCH_BULLISH' ? 'Observar alta' :
                    row.classification === 'WATCH_BEARISH' ? 'Observar baixa' : 'Sem configuração'}</span>
                </div>
                <p className="mt-1">RSI {row.rsi14.toFixed(1)} · Volume {row.volumeRatio.toFixed(2)}x · ATR {row.atrPct.toFixed(2)}%</p>
                <p className="mt-1 text-slate-500">{row.trend} · Sem autorização para operar</p>
              </div>
            ))}
          </div>
        )}
      </section>
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
              Cotações Binance Spot ({filteredAssets.length} Ativos)
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
              Profundidade Binance Spot
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">{inspectedAsset.symbol} — livro de ofertas público em tempo quase real</span>
          </div>

          <div className="space-y-3 font-mono text-[11px]">
            {/* Asks (Venda) */}
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase">Ordens de Venda (Asks)</span>
              {orderBook?.asks.slice(0, 4).reverse().map((ask, i) => (
                <div key={i} className="flex justify-between text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded">
                  <span>${ask.price.toFixed(inspectedAsset.decimalPlaces)}</span>
                  <span className="text-slate-400">{ask.quantity.toFixed(5)}</span>
                  <span className="text-slate-500">${ask.notional.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {orderBookError && <p role="alert" className="text-[10px] text-rose-400">{orderBookError}</p>}
            {!orderBook && !orderBookError && <p className="text-[10px] text-slate-500">Carregando profundidade real...</p>}

            {/* Mid Price */}
            <div className="py-1 px-2 bg-slate-800 rounded text-center font-bold text-white text-xs">
              ${inspectedAsset.price.toFixed(inspectedAsset.decimalPlaces)}
              <span className="text-[10px] text-slate-400 font-normal ml-2">Spread: ${inspectedAsset.spread}</span>
            </div>

            {/* Bids (Compra) */}
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase">Ordens de Compra (Bids)</span>
              {orderBook?.bids.slice(0, 4).map((bid, i) => (
                <div key={i} className="flex justify-between text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded">
                  <span>${bid.price.toFixed(inspectedAsset.decimalPlaces)}</span>
                  <span className="text-slate-400">{bid.quantity.toFixed(5)}</span>
                  <span className="text-slate-500">${bid.notional.toFixed(2)}</span>
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
