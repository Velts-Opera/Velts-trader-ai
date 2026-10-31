# VELTS TRADER AI 📈🤖
### Institutional Quantitative Trading Platform with Multi-Agent AI & Deterministic Risk Management

![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![React](https://img.shields.io/badge/React-19-cyan.svg)
![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)
![Supabase](https://img.shields.io/badge/PostgreSQL-Supabase%20RLS-3ECF8E.svg)
![Gemini AI](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-4285F4.svg)
![Tests](https://img.shields.io/badge/Tests-18%2F18%20Passing-brightgreen.svg)

VELTS TRADER AI is an institutional-grade algorithmic trading workstation designed for high-frequency risk surveillance, quantitative backtesting, and AI committee-driven market analysis. Built with strict safety controls, deterministic risk firewalls, and multi-tenant PostgreSQL Row-Level Security (RLS).

---

## 🏛️ System Architecture

```
                                ┌─────────────────────────┐
                                │   Google Gemini 2.5     │
                                │   5-Agent AI Committee  │
                                └────────────┬────────────┘
                                             │ (Advisory Only)
                                             ▼
┌──────────────────────┐        ┌─────────────────────────┐        ┌─────────────────────────┐
│   Market Feeds       │───────▶│ Deterministic Risk      │───────▶│ Order State Machine     │
│ (Crypto, US, EUR, FX)│        │ Engine (Max 0.5%/trade) │        │ (Mandatory Stop-Loss)   │
└──────────────────────┘        └────────────┬────────────┘        └────────────┬────────────┘
                                             │                                  │
                                             ▼                                  ▼
                                ┌─────────────────────────┐        ┌─────────────────────────┐
                                │ Tamper-Resistant Audit  │        │ Dual Storage Engine     │
                                │ Trail (HMAC-SHA256)     │        │ Supabase Cloud + Local  │
                                └─────────────────────────┘        └─────────────────────────┘
```

---

## ✨ Core Features

1. **Deterministic Risk Firewall**
   - **Mandatory Stop-Loss**: No order can exist without a mathematically valid stop-loss.
   - **Position Sizing**: Strictly capped at 0.5% risk of equity per trade.
   - **Exposure Ceiling**: Maximum 10% asset exposure per instrument.
   - **Daily / Weekly Circuit Breakers**: Automatic trading halt if daily loss exceeds 2.0% or weekly loss exceeds 5.0%.
   - **Emergency Kill-Switch**: One-click instant position liquidation and bot shutdown.

2. **5-Agent AI Deliberation Committee**
   - **Technical Analyst**: Evaluates RSI, MACD, Bollinger Bands, EMA 20/50/200, and ATR.
   - **Fundamental Analyst**: Macroeconomic landscape, Fed/ECB rates, institutional inflows.
   - **Quantitative Analyst**: Statistical arbitrage, momentum velocity, mean reversion probabilities.
   - **Risk Manager**: Has absolute veto power over any trade proposal.
   - **Supervisor Agent**: Synthesizes the debate into a single execution plan with confidence scoring.

3. **Dual Persistence Mode (Zero Configuration Required)**
   - **Local Sandbox (Default)**: Runs 100% in-browser with full order matching and portfolio simulation.
   - **Cloud PostgreSQL (Supabase)**: Multi-tenant synchronization with Row-Level Security (RLS) isolating all user data via `auth.uid()`.

4. **Institutional Security & Banking Alignment**
   - **AI Air-Gap**: AI models are isolated from private keys and have strictly zero withdrawal permissions.
   - **Idempotency & Anti-Replay Tokens**: Prevents duplicate executions during network hiccups.
   - **Immutable Audit Trail**: SHA-256 chained hash signatures for non-repudiation.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/SEU-USUARIO/velts-trader-ai.git
cd velts-trader-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Copy the template:
```bash
cp .env.example .env
```

Edit `.env` (optional, the app works out-of-the-box in local paper trading mode):
```env
# Optional: Supabase credentials for cloud PostgreSQL persistence
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Optional: Gemini API Key for live AI Agent committee analysis
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Run tests
Ensure all 18 core risk, state graph, and math engine tests pass:
```bash
npm test
# or
npx tsx --test src/core/*.test.ts
```

### 5. Start development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`src/lib/databaseSchema.sql`](src/lib/databaseSchema.sql).
4. The schema automatically creates:
   - `users`: Profiles with institutional balance tracking and 2FA flags.
   - `orders`: Order state machine with mandatory stop-loss constraints.
   - `positions`: Real-time portfolio positions with live PnL.
   - `market_data`: Multi-asset ticker feeds.
   - `audit_logs`: Tamper-resistant append-only compliance logs.
   - `agent_analysis_logs`: Multi-agent reasoning transcripts.
   - Complete **Row-Level Security (RLS)** policies isolating records per `auth.uid()`.

---

## 🧪 Testing Suite

The platform includes automated deterministic unit tests:
```bash
npx tsx --test src/core/*.test.ts
```
Covering:
- Position sizing algorithms under varying account balances.
- Circuit breaker trip points (emergency stops, daily loss limits).
- Finite state machine valid transitions.
- HMAC signature generation and verification.
- Sliding window rate limiting and token idempotency.

---

## 📄 License

MIT License. Designed for quantitative traders, developers, and institutional risk officers.
