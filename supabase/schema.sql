-- ==============================================================================
-- VELTS TRADER AI — Database Schema (PostgreSQL / Supabase)
-- Autonomous Trading Platform with Deterministic Risk & Multi-Agent AI
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Custom Types & Enums
DO $$ BEGIN
    CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('MARKET', 'LIMIT', 'STOP_LIMIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_state AS ENUM (
        'CREATED',
        'VALIDATED',
        'SUBMITTED',
        'PARTIALLY_FILLED',
        'FILLED',
        'REJECTED',
        'CANCELLED',
        'EXPIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE market_category AS ENUM ('crypto', 'us_stocks', 'european', 'forex');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE currency_code AS ENUM ('USD', 'EUR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE agent_role AS ENUM (
        'TECHNICAL',
        'FUNDAMENTAL',
        'QUANTITATIVE',
        'RISK_MANAGER',
        'SUPERVISOR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. User Profiles & Preferences (Usuários)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    preferred_currency currency_code DEFAULT 'USD',
    is_live_enabled BOOLEAN DEFAULT FALSE,
    live_activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Broker Integrations (Corretoras)
CREATE TABLE IF NOT EXISTS broker_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    broker_name TEXT NOT NULL, -- 'Binance', 'Interactive Brokers', 'Paper Trading'
    environment TEXT NOT NULL DEFAULT 'sandbox', -- 'sandbox', 'paper', 'production'
    is_active BOOLEAN DEFAULT TRUE,
    api_key_ref TEXT, -- secure vault key reference (never plain text)
    account_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Assets & Instruments (Ativos)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT UNIQUE NOT NULL, -- 'BTC/USD', 'AAPL', 'ASML', 'EUR/USD'
    name TEXT NOT NULL,
    category market_category NOT NULL,
    base_currency currency_code NOT NULL DEFAULT 'USD',
    is_tradable BOOLEAN DEFAULT TRUE,
    min_order_size NUMERIC(18, 6) DEFAULT 0.0001,
    tick_size NUMERIC(18, 6) DEFAULT 0.01,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Quantitative Strategies (Estratégias)
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'trend_following', 'mean_reversion', 'momentum', 'ai_consensus'
    is_active BOOLEAN DEFAULT TRUE,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    estimated_win_rate NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Generated Trading Signals (Sinais)
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    side order_side NOT NULL,
    entry_price NUMERIC(18, 6) NOT NULL,
    stop_loss_price NUMERIC(18, 6) NOT NULL,
    take_profit_price NUMERIC(18, 6),
    confidence_score NUMERIC(5, 2), -- 0.00 to 100.00
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'EXPIRED', 'REJECTED'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Orders & State Machine (Ordens)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    broker_account_id UUID REFERENCES broker_accounts(id) ON DELETE SET NULL,
    asset_id UUID NOT NULL REFERENCES assets(id),
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    client_order_id TEXT NOT NULL,
    side order_side NOT NULL,
    type order_type NOT NULL DEFAULT 'MARKET',
    quantity NUMERIC(18, 6) NOT NULL,
    target_price NUMERIC(18, 6),
    stop_loss_price NUMERIC(18, 6) NOT NULL, -- Mandatory risk parameter
    take_profit_price NUMERIC(18, 6),
    executed_price NUMERIC(18, 6),
    slippage NUMERIC(18, 6) DEFAULT 0,
    fee NUMERIC(18, 6) DEFAULT 0,
    state order_state NOT NULL DEFAULT 'CREATED',
    state_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    currency currency_code NOT NULL DEFAULT 'USD',
    is_paper BOOLEAN NOT NULL DEFAULT TRUE,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Executions & Fills (Execuções)
CREATE TABLE IF NOT EXISTS executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    price NUMERIC(18, 6) NOT NULL,
    quantity NUMERIC(18, 6) NOT NULL,
    slippage NUMERIC(18, 6) NOT NULL DEFAULT 0,
    fee NUMERIC(18, 6) NOT NULL DEFAULT 0,
    exchange_execution_id TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Active Positions (Posições)
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id),
    side order_side NOT NULL,
    quantity NUMERIC(18, 6) NOT NULL,
    entry_price NUMERIC(18, 6) NOT NULL,
    current_price NUMERIC(18, 6) NOT NULL,
    stop_loss_price NUMERIC(18, 6) NOT NULL,
    take_profit_price NUMERIC(18, 6),
    unrealized_pnl NUMERIC(18, 6) DEFAULT 0,
    unrealized_pnl_pct NUMERIC(8, 4) DEFAULT 0,
    realized_pnl NUMERIC(18, 6) DEFAULT 0,
    currency currency_code NOT NULL DEFAULT 'USD',
    exposure_pct NUMERIC(6, 2) DEFAULT 0,
    is_paper BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Account Balances & Portfolio Summary (Saldos)
CREATE TABLE IF NOT EXISTS account_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_paper BOOLEAN NOT NULL DEFAULT TRUE,
    cash_usd NUMERIC(18, 4) NOT NULL DEFAULT 100000.00,
    equity_usd NUMERIC(18, 4) NOT NULL DEFAULT 100000.00,
    cash_eur NUMERIC(18, 4) NOT NULL DEFAULT 92165.90,
    equity_eur NUMERIC(18, 4) NOT NULL DEFAULT 92165.90,
    daily_pnl NUMERIC(18, 4) DEFAULT 0,
    weekly_pnl NUMERIC(18, 4) DEFAULT 0,
    monthly_pnl NUMERIC(18, 4) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_balance_env UNIQUE (user_id, is_paper)
);

-- 11. Closed Trade Results (Resultados)
CREATE TABLE IF NOT EXISTS trade_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    side order_side NOT NULL,
    entry_price NUMERIC(18, 6) NOT NULL,
    exit_price NUMERIC(18, 6) NOT NULL,
    quantity NUMERIC(18, 6) NOT NULL,
    gross_pnl NUMERIC(18, 4) NOT NULL,
    net_pnl NUMERIC(18, 4) NOT NULL,
    net_pnl_pct NUMERIC(8, 4) NOT NULL,
    total_fees NUMERIC(18, 4) NOT NULL DEFAULT 0,
    currency currency_code NOT NULL DEFAULT 'USD',
    close_reason TEXT NOT NULL, -- 'STOP_LOSS', 'TAKE_PROFIT', 'MANUAL', 'EMERGENCY_STOP'
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Risk Configs (Configurações de Risco)
CREATE TABLE IF NOT EXISTS risk_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    max_risk_per_trade_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.50, -- 0.5% max risk
    daily_loss_limit_pct NUMERIC(5, 2) NOT NULL DEFAULT 2.00,    -- 2.0% daily max loss
    weekly_loss_limit_pct NUMERIC(5, 2) NOT NULL DEFAULT 5.00,   -- 5.0% weekly max loss
    max_asset_exposure_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00, -- 10.0% max exposure per asset
    allow_leverage BOOLEAN NOT NULL DEFAULT FALSE,               -- Strictly false in v1
    require_stop_loss BOOLEAN NOT NULL DEFAULT TRUE,             -- Strictly true
    emergency_stop_activated BOOLEAN NOT NULL DEFAULT FALSE,      -- Kill-switch
    prohibit_averaging_down BOOLEAN NOT NULL DEFAULT TRUE,        -- Anti-martingale
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AI Agent Analysis History (Histórico de Análises dos Agentes)
CREATE TABLE IF NOT EXISTS agent_analysis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    asset_id UUID NOT NULL REFERENCES assets(id),
    agent_role agent_role NOT NULL,
    sentiment TEXT NOT NULL, -- 'BULLISH', 'BEARISH', 'NEUTRAL'
    confidence_score NUMERIC(5, 2) NOT NULL,
    summary TEXT NOT NULL,
    key_points JSONB DEFAULT '[]'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    risk_cleared BOOLEAN,
    supervisor_consensus JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Audit Logs (Logs de Auditoria)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'ORDER_PLACED', 'RISK_BREACH', 'EMERGENCY_STOP_TRIGGERED', 'LIVE_MODE_ATTEMPT'
    severity TEXT NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARN', 'CRITICAL'
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-FREQUENCY FINANCIAL QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_state ON orders(user_id, state);
CREATE INDEX IF NOT EXISTS idx_orders_symbol_created ON orders(asset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_user_asset ON positions(user_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_signals_asset_created ON signals(asset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_asset_agent ON agent_analysis_logs(asset_id, agent_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_created ON audit_logs(event_type, created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read and update their own profile
CREATE POLICY "Users can manage own profile"
    ON profiles FOR ALL
    USING (auth.uid() = id);

-- Broker Accounts: user-scoped
CREATE POLICY "Users can manage own broker accounts"
    ON broker_accounts FOR ALL
    USING (auth.uid() = user_id);

-- Strategies: user-scoped
CREATE POLICY "Users can manage own strategies"
    ON strategies FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Orders: user-scoped
CREATE POLICY "Users can manage own orders"
    ON orders FOR ALL
    USING (auth.uid() = user_id);

-- Positions: user-scoped
CREATE POLICY "Users can view own positions"
    ON positions FOR ALL
    USING (auth.uid() = user_id);

-- Account Balances: user-scoped
CREATE POLICY "Users can view own balances"
    ON account_balances FOR ALL
    USING (auth.uid() = user_id);

-- Risk Configs: user-scoped
CREATE POLICY "Users can manage own risk configs"
    ON risk_configs FOR ALL
    USING (auth.uid() = user_id);

-- Audit Logs: user-scoped
CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Assets & Signals: publicly readable by authenticated users
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assets are viewable by all authenticated users"
    ON assets FOR SELECT
    USING (true);

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signals are viewable by all authenticated users"
    ON signals FOR SELECT
    USING (true);

-- ==============================================================================
-- SEED INITIAL ASSETS (CRYPTO, US STOCKS, EUROPEAN STOCKS, FOREX)
-- ==============================================================================
INSERT INTO assets (symbol, name, category, base_currency, min_order_size, tick_size)
VALUES
    ('BTC/USD', 'Bitcoin Spot', 'crypto', 'USD', 0.0001, 0.01),
    ('ETH/USD', 'Ethereum Spot', 'crypto', 'USD', 0.001, 0.01),
    ('SOL/USD', 'Solana Spot', 'crypto', 'USD', 0.01, 0.01),
    ('BNB/USD', 'BNB Spot', 'crypto', 'USD', 0.01, 0.01),
    ('AAPL', 'Apple Inc.', 'us_stocks', 'USD', 1.0, 0.01),
    ('NVDA', 'NVIDIA Corporation', 'us_stocks', 'USD', 1.0, 0.01),
    ('MSFT', 'Microsoft Corporation', 'us_stocks', 'USD', 1.0, 0.01),
    ('SPY', 'SPDR S&P 500 ETF Trust', 'us_stocks', 'USD', 1.0, 0.01),
    ('QQQ', 'Invesco QQQ Trust (Nasdaq 100)', 'us_stocks', 'USD', 1.0, 0.01),
    ('ASML.AS', 'ASML Holding N.V. (Euronext)', 'european', 'EUR', 1.0, 0.05),
    ('SAP.DE', 'SAP SE (XETRA)', 'european', 'EUR', 1.0, 0.05),
    ('LVMH.PA', 'LVMH Moët Hennessy Louis Vuitton', 'european', 'EUR', 1.0, 0.10),
    ('EUR/USD', 'Euro / US Dollar', 'forex', 'USD', 1000.0, 0.0001),
    ('GBP/USD', 'British Pound / US Dollar', 'forex', 'USD', 1000.0, 0.0001),
    ('USD/JPY', 'US Dollar / Japanese Yen', 'forex', 'USD', 1000.0, 0.01)
ON CONFLICT (symbol) DO NOTHING;
