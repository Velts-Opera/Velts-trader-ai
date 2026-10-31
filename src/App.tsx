import React, { useState, useEffect, useRef } from 'react';
import { MarketAsset, Currency, RiskConfig, StrategyDefinition, Position, Order, CommitteeDecision } from './types/trading';
import { INITIAL_ASSETS, EUR_USD_RATE, simulateMarketTick } from './services/marketData';
import { DEFAULT_RISK_CONFIG } from './core/riskManager';
import { PaperAccount, processOrderExecution, updatePositionsMarketPrice } from './core/tradingEngine';
import { Header } from './components/layout/Header';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { MarketsTab } from './components/markets/MarketsTab';
import { AgentsTab } from './components/agents/AgentsTab';
import { StrategiesTab } from './components/strategies/StrategiesTab';
import { BacktestingTab } from './components/backtesting/BacktestingTab';
import { RiskTab } from './components/risk/RiskTab';
import { SecurityCenterTab } from './components/security/SecurityCenterTab';
import { TraderSkillsTab } from './components/traderSkills/TraderSkillsTab';
import { OrderHistoryTab } from './components/orders/OrderHistoryTab';
import { TradeModal } from './components/modals/TradeModal';
import { LiveActivationModal } from './components/liveChecklist/LiveActivationModal';
import { AuthModal } from './components/auth/AuthModal';
import { dbService } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [assets, setAssets] = useState<MarketAsset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(INITIAL_ASSETS[0]);
  const [riskConfig, setRiskConfig] = useState<RiskConfig>(DEFAULT_RISK_CONFIG);

  const [tradeModalAsset, setTradeModalAsset] = useState<MarketAsset | null>(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAutomatedRunning, setIsAutomatedRunning] = useState(false);

  // Authenticated operator session
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>({
    email: 'veltrani@gmail.com',
    name: 'Carlos Veltrani',
  });

  // Initialize paper trading account with $100,000 USD virtual balance
  const [account, setAccount] = useState<PaperAccount>({
    equityUSD: 100000.0,
    cashUSD: 100000.0,
    equityEUR: 100000.0 / EUR_USD_RATE,
    cashEUR: 100000.0 / EUR_USD_RATE,
    activeCurrency: 'USD',
    eurUsdRate: EUR_USD_RATE,
    positions: [],
    orders: [],
    executedTradesCount: 0,
    dailyRealizedPnL: 0,
    weeklyRealizedPnL: 0,
  });

  // Active quantitative strategies
  const [strategies, setStrategies] = useState<StrategyDefinition[]>([
    {
      id: 'trend_following',
      name: 'Seguidor de Tendência (EMA 20/50)',
      description: 'Cruza médias móveis exponenciais rápidas e lentas para surfar movimentos direcionais.',
      category: 'trend_following',
      isActive: true,
      timeframe: '1H',
      winRateEstimated: 58.4,
      sharpeEstimated: 1.72,
      parameters: { fastPeriod: 20, slowPeriod: 50, trailingAtrMult: 1.5 },
    },
    {
      id: 'mean_reversion',
      name: 'Reversão à Média (Bollinger + RSI 30/70)',
      description: 'Explora o retorno estatístico aos desvios padrão em zonas de exaustão extrema de preço.',
      category: 'mean_reversion',
      isActive: true,
      timeframe: '15M',
      winRateEstimated: 64.2,
      sharpeEstimated: 1.88,
      parameters: { rsiOversold: 30, rsiOverbought: 70, bbStdDev: 2 },
    },
    {
      id: 'momentum_breakout',
      name: 'Rompimento de Momento (MACD + ATR Expansion)',
      description: 'Detecta aceleração do histograma MACD alinhado à expansão da volatilidade média.',
      category: 'momentum',
      isActive: false,
      timeframe: '4H',
      winRateEstimated: 52.8,
      sharpeEstimated: 1.54,
      parameters: { macdFast: 12, macdSlow: 26, macdSignal: 9 },
    },
    {
      id: 'ai_consensus',
      name: 'Consenso dos 5 Agentes de IA',
      description: 'Deliberação integrada entre Analista Técnico, Fundamentalista, Quantitativo e Gerenciador de Risco.',
      category: 'ai_consensus',
      isActive: true,
      timeframe: '1H',
      winRateEstimated: 68.5,
      sharpeEstimated: 2.15,
      parameters: { minConsensusConfidence: 70, requireRiskApproval: 1 },
    },
  ]);

  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  // Market Live Micro-Tick Simulator & Stop-Loss/Take-Profit Automated Monitor
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets((prev) => {
        const updated = simulateMarketTick(prev);
        const priceMap: Record<string, number> = {};
        updated.forEach((a) => {
          priceMap[a.symbol] = a.price;
        });

        setAccount((prevAccount) => {
          if (prevAccount.positions.length === 0) return prevAccount;
          const { updatedAccount, triggeredOrders } = updatePositionsMarketPrice(prevAccount, priceMap);
          if (triggeredOrders.length > 0) {
            triggeredOrders.forEach((o) => {
              dbService.recordAudit('AUTOMATIC_TRIGGER_EXIT', { orderId: o.id, symbol: o.symbol });
            });
          }
          return updatedAccount;
        });

        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Automated Strategy Execution Cycle
  const runAutomatedStrategyCycle = () => {
    if (riskConfig.emergencyStopActivated) return;

    const activeStrats = strategies.filter((s) => s.isActive);
    if (activeStrats.length === 0) return;

    const targetAsset = assets[Math.floor(Math.random() * assets.length)];
    const chosenStrat = activeStrats[Math.floor(Math.random() * activeStrats.length)];

    const slDist = targetAsset.price * 0.02;
    const stopLossPrice = targetAsset.price - slDist;
    const takeProfitPrice = targetAsset.price + slDist * 2.5;

    setAccount((prevAccount) => {
      const { account: newAcc, execution } = processOrderExecution(
        {
          symbol: targetAsset.symbol,
          side: 'BUY',
          type: 'MARKET',
          quantity: 1,
          targetPrice: targetAsset.price,
          stopLossPrice,
          takeProfitPrice,
          currency: targetAsset.currency,
          strategyId: chosenStrat.id,
        },
        prevAccount,
        targetAsset.spread,
        riskConfig
      );

      if (execution.order.state === 'FILLED') {
        dbService.recordAudit('ORDER_FILLED_AUTO', { symbol: targetAsset.symbol, strat: chosenStrat.name });
      }

      return newAcc;
    });
  };

  useEffect(() => {
    if (!isAutomatedRunning) return;
    const autoInterval = setInterval(() => {
      runAutomatedStrategyCycle();
    }, 15000);

    return () => clearInterval(autoInterval);
  }, [isAutomatedRunning, strategies, riskConfig, assets]);

  // Order execution from modal or agent ticket
  const handleExecuteOrder = (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: import('./types/trading').OrderType;
    quantity: number;
    targetPrice: number;
    stopLossPrice: number;
    takeProfitPrice?: number;
  }) => {
    const asset = assets.find((a) => a.symbol === params.symbol) || selectedAsset;

    setAccount((prev) => {
      const { account: newAcc, execution } = processOrderExecution(
        {
          ...params,
          currency: asset.currency,
        },
        prev,
        asset.spread,
        riskConfig
      );

      dbService.saveOrder(execution.order, currentUser?.email);
      return newAcc;
    });
  };

  const handleClosePosition = (positionId: string) => {
    const pos = account.positions.find((p) => p.id === positionId);
    if (!pos) return;

    handleExecuteOrder({
      symbol: pos.symbol,
      side: pos.side === 'BUY' ? 'SELL' : 'BUY',
      type: 'MARKET',
      quantity: pos.quantity,
      targetPrice: pos.currentPrice,
      stopLossPrice: 0.001,
    });
  };

  const handleToggleEmergencyStop = () => {
    const nextState = !riskConfig.emergencyStopActivated;
    setRiskConfig((prev) => ({
      ...prev,
      emergencyStopActivated: nextState,
    }));
    if (nextState) {
      setIsAutomatedRunning(false);
      dbService.recordAudit('EMERGENCY_STOP_TRIGGERED', { timestamp: Date.now() }, 'CRITICAL');
    }
  };

  const handleCloseAllPositions = () => {
    account.positions.forEach((p) => {
      handleClosePosition(p.id);
    });
  };

  const handleApplyRecommendationToTrade = (dec: CommitteeDecision) => {
    const asset = assets.find((a) => a.symbol === dec.symbol) || selectedAsset;
    setTradeModalAsset(asset);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        equityUSD={account.equityUSD}
        equityEUR={account.equityEUR}
        isEmergencyStop={riskConfig.emergencyStopActivated}
        onToggleEmergencyStop={handleToggleEmergencyStop}
        onOpenLiveModal={() => setIsLiveModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'dashboard' && (
          <OverviewTab
            assets={assets}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset}
            positions={account.positions}
            orders={account.orders}
            equityUSD={account.equityUSD}
            cashUSD={account.cashUSD}
            equityEUR={account.equityEUR}
            cashEUR={account.cashEUR}
            currency={currency}
            dailyPnL={account.dailyRealizedPnL}
            weeklyPnL={account.weeklyRealizedPnL}
            riskConfig={riskConfig}
            onOpenTradeModal={(a) => setTradeModalAsset(a)}
            onClosePosition={handleClosePosition}
            onNavigateToAgents={() => setActiveTab('agents')}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsTab
            assets={assets}
            onSelectAsset={setSelectedAsset}
            onOpenTradeModal={(a) => setTradeModalAsset(a)}
            onAnalyzeAssetWithAI={(a) => {
              setSelectedAsset(a);
              setActiveTab('agents');
            }}
          />
        )}

        {activeTab === 'agents' && (
          <AgentsTab
            assets={assets}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset}
            currency={currency}
            onApplyRecommendationToTrade={handleApplyRecommendationToTrade}
          />
        )}

        {activeTab === 'strategies' && (
          <StrategiesTab
            strategies={strategies}
            onToggleStrategy={(id) => {
              setStrategies((prev) =>
                prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
              );
            }}
            isAutomatedExecutionRunning={isAutomatedRunning}
            onToggleAutomation={() => setIsAutomatedRunning((prev) => !prev)}
            onRunStrategyCycle={runAutomatedStrategyCycle}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestingTab assets={assets} strategies={strategies} />
        )}

        {activeTab === 'risk' && (
          <RiskTab
            riskConfig={riskConfig}
            onUpdateRiskConfig={setRiskConfig}
            equityUSD={account.equityUSD}
            dailyPnL={account.dailyRealizedPnL}
            weeklyPnL={account.weeklyRealizedPnL}
            positions={account.positions}
            onToggleEmergencyStop={handleToggleEmergencyStop}
            onCloseAllPositions={handleCloseAllPositions}
          />
        )}

        {activeTab === 'security' && <SecurityCenterTab />}

        {activeTab === 'trader_skills' && (
          <TraderSkillsTab equityUSD={account.equityUSD} />
        )}

        {activeTab === 'orders' && <OrderHistoryTab orders={account.orders} />}
      </main>

      {/* Trade Modal */}
      {tradeModalAsset && (
        <TradeModal
          isOpen={Boolean(tradeModalAsset)}
          onClose={() => setTradeModalAsset(null)}
          asset={tradeModalAsset}
          equityUSD={account.equityUSD}
          currency={currency}
          riskConfig={riskConfig}
          onExecuteOrder={handleExecuteOrder}
        />
      )}

      {/* Live Activation Checklist Modal */}
      <LiveActivationModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        isLive={false}
        onConfirmLiveToggle={(enabled: boolean) => {
          if (!enabled) {
            console.log('Mantido em Paper Trading');
          }
        }}
      />

      {/* Auth & Operator Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => setCurrentUser(user)}
        onLogout={() => setCurrentUser(null)}
      />
    </div>
  );
}
