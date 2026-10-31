-- ==============================================================================
-- VELTS TRADER AI - INSTITUTIONAL POSTGRESQL & SUPABASE SCHEMA
-- Target Database: PostgreSQL 14+ (Supabase compatible)
-- Description: Core schema for Users, Orders, Positions, Market Data, and Audit Logs
-- Security: Strict Row-Level Security (RLS) policies ensuring tenant/user data isolation.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TRIGGER HELPER FOR AUTOMATIC 'updated_at' TIMESTAMP REFRESH
-- ==============================================================================
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. USERS / PROFILES TABLE
-- Directly mapped to Supabase auth.users or standalone UUIDs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    account_tier TEXT DEFAULT 'institutional' CHECK (account_tier IN ('retail', 'professional', 'institutional', 'compliance_officer')),
    base_currency TEXT DEFAULT 'USD' CHECK (base_currency IN ('USD', 'EUR')),
    paper_balance_usd NUMERIC(18, 2) NOT NULL DEFAULT 100000.00 CHECK (paper_balance_usd >= 0),
    paper_balance_eur NUMERIC(18, 2) NOT NULL DEFAULT 95000.00 CHECK (paper_balance_eur >= 0),
    is_live_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    risk_limits JSONB NOT NULL DEFAULT '{
        "maxRiskPerTradePct": 0.5,
        "dailyLossLimitPct": 2.0,
        "weeklyLossLimitPct": 5.0,
        "maxAssetExposurePct": 10.0,
        "allowLeverage": false,
        "requireStopLoss": true,
        "emergencyStopActivated": false,
        "prohibitAveragingDown": true
    }'::jsonb,
    is_2fa_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ==============================================================================
-- 4. ORDERS TABLE
-- State machine: CREATED -> VALIDATED -> SUBMITTED -> (PARTIALLY_FILLED) -> FILLED | REJECTED | CANCELLED | EXPIRED
-- Mandatory stop loss check enforced at column level
-- ==============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_order_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    type TEXT NOT NULL CHECK (type IN ('MARKET', 'LIMIT', 'STOP_LIMIT')),
    quantity NUMERIC(18, 8) NOT NULL CHECK (quantity > 0),
    target_price NUMERIC(18, 4),
    stop_loss_price NUMERIC(18, 4) NOT NULL, -- Mandatory risk constraint
    take_profit_price NUMERIC(18, 4),
    executed_price NUMERIC(18, 4),
    slippage NUMERIC(18, 6) DEFAULT 0,
    fee NUMERIC(18, 4) DEFAULT 0,
    state TEXT NOT NULL DEFAULT 'CREATED' CHECK (
        state IN ('CREATED', 'VALIDATED', 'SUBMITTED', 'PARTIALLY_FILLED', 'FILLED', 'REJECTED', 'CANCELLED', 'EXPIRED')
    ),
    state_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR')),
    is_paper BOOLEAN NOT NULL DEFAULT TRUE,
    rejection_reason TEXT,
    strategy_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_stop_loss_validity CHECK (stop_loss_price > 0)
);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- High-frequency indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_state ON orders (user_id, state);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders (symbol);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders (client_order_id);

-- ==============================================================================
-- 5. POSITIONS TABLE
-- Open/closed portfolios tracking real-time unrealized and realized PnL
-- ==============================================================================
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity NUMERIC(18, 8) NOT NULL CHECK (quantity > 0),
    entry_price NUMERIC(18, 4) NOT NULL CHECK (entry_price > 0),
    current_price NUMERIC(18, 4) NOT NULL CHECK (current_price > 0),
    stop_loss_price NUMERIC(18, 4) NOT NULL CHECK (stop_loss_price > 0),
    take_profit_price NUMERIC(18, 4),
    unrealized_pnl NUMERIC(18, 4) NOT NULL DEFAULT 0,
    unrealized_pnl_pct NUMERIC(10, 4) NOT NULL DEFAULT 0,
    realized_pnl NUMERIC(18, 4) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'LIQUIDATED')),
    exposure_pct NUMERIC(8, 4) DEFAULT 0,
    is_paper BOOLEAN NOT NULL DEFAULT TRUE,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_positions_updated_at
BEFORE UPDATE ON positions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- Indexes for positions
CREATE INDEX IF NOT EXISTS idx_positions_user_status ON positions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_user_symbol ON positions (user_id, symbol);

-- ==============================================================================
-- 6. MARKET_DATA TABLE
-- Central repository for real-time tickers, spreads, bid/ask, and historical OHLCV feeds
-- ==============================================================================
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('crypto', 'us_stocks', 'european', 'forex')),
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR')),
    price NUMERIC(18, 4) NOT NULL CHECK (price >= 0),
    change_24h NUMERIC(8, 4) NOT NULL DEFAULT 0,
    high_24h NUMERIC(18, 4),
    low_24h NUMERIC(18, 4),
    volume_24h NUMERIC(22, 2) NOT NULL DEFAULT 0,
    bid NUMERIC(18, 4),
    ask NUMERIC(18, 4),
    spread NUMERIC(18, 4),
    decimal_places INTEGER NOT NULL DEFAULT 2,
    instrument_type TEXT NOT NULL DEFAULT 'spot' CHECK (instrument_type IN ('spot', 'stock', 'etf', 'forex')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup for market feeds
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_rec ON market_data (symbol, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_category ON market_data (category);

-- ==============================================================================
-- 7. AUDIT_LOGS TABLE
-- Append-only tamper-resistant institutional audit trail
-- Disallows UPDATE and DELETE operations for non-superusers to satisfy compliance
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARN', 'CRITICAL')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    signature_hash TEXT, -- HMAC / SHA256 integrity hash
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query optimizations for compliance auditing
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs (severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs (event_type);

-- ==============================================================================
-- 8. AGENT_ANALYSIS_LOGS TABLE (Gemini Multi-Agent Committee Decision Logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS agent_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_role TEXT NOT NULL CHECK (agent_role IN ('TECHNICAL', 'FUNDAMENTAL', 'QUANTITATIVE', 'RISK_MANAGER', 'SUPERVISOR')),
    sentiment TEXT NOT NULL CHECK (sentiment IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
    confidence_score NUMERIC(5, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    summary TEXT NOT NULL,
    key_points JSONB DEFAULT '[]'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    risk_cleared BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_user ON agent_analysis_logs (user_id, created_at DESC);

-- ==============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- Strict user isolation enforcing auth.uid() = user_id
-- ==============================================================================

-- 9.1 Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_analysis_logs ENABLE ROW LEVEL SECURITY;

-- 9.2 USERS Policies
CREATE POLICY "users_select_own"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "users_insert_own"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 9.3 ORDERS Policies (Tenant isolation)
CREATE POLICY "orders_select_own"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_own"
    ON orders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9.4 POSITIONS Policies (Tenant isolation)
CREATE POLICY "positions_select_own"
    ON positions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "positions_insert_own"
    ON positions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "positions_update_own"
    ON positions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9.5 MARKET_DATA Policies (Public read-only market feed, protected writes)
CREATE POLICY "market_data_select_public"
    ON market_data FOR SELECT
    USING (TRUE);

-- Write operations on market_data restricted to service_role or admin
CREATE POLICY "market_data_insert_service"
    ON market_data FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "market_data_update_service"
    ON market_data FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 9.6 AUDIT_LOGS Policies (Tamper-Resistant)
-- Users can view their own audit records
CREATE POLICY "audit_logs_select_own"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Append-only for authenticated sessions or server functions
CREATE POLICY "audit_logs_insert_own"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Strict compliance: NO UPDATE and NO DELETE policies are created for audit_logs.
-- Non-superusers cannot alter or erase audit logs.

-- 9.7 AGENT_ANALYSIS_LOGS Policies
CREATE POLICY "agent_analysis_select_own"
    ON agent_analysis_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "agent_analysis_insert_own"
    ON agent_analysis_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 10. AUTOMATIC PROFILE CREATION ON USER SIGNUP (Supabase Auth Hook)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution whenever a user registers via Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
