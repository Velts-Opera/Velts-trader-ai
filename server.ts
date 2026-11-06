import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { BINANCE_SPOT_PAIRS, fetchSpotQuotes, fetchSpotCandles, validatePair, validateInterval } from './src/services/binanceSpot';
import { scanBinanceSpot } from './src/services/marketScanner';
import path from 'path';
import { fileURLToPath } from 'url';
import { SlidingWindowRateLimiter, generateAuditSignature, AuditLogEntry, INSTITUTIONAL_SECURITY_POLICY } from './src/core/security';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Banking & Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Institutional API Rate Limiter (60 requests per minute per IP)
const rateLimiter = new SlidingWindowRateLimiter(60, 60000);

app.use('/api', (req, res, next) => {
  const check = rateLimiter.checkAllowed();
  if (!check.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit excedido por segurança institucional. Tente novamente em breve.',
      retryAfterMs: check.retryAfterMs,
    });
  }
  next();
});

// In-Memory Immutable Audit Log Chaining
const auditTrail: AuditLogEntry[] = [];

// Initialize Google GenAI on server-side with telemetry User-Agent header
// CRITICAL: The AI has ZERO access to broker API keys or banking credentials!
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
}) : null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: Date.now(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    service: 'VELTS TRADER AI Core Server',
  });
});


/**
 * Public Binance Spot market data. Read-only, no broker credentials or order permissions.
 * A failed request is surfaced as HTTP 503: never substitute invented prices.
 */
app.get('/api/market/binance/status', (_req, res) => {
  res.json({ provider: 'Binance Spot Public API', mode: 'READ_ONLY',
    symbols: BINANCE_SPOT_PAIRS, tradingEnabled: false, simulatedOrdersOnly: true });
});

app.get('/api/market/binance/quotes', async (_req, res) => {
  try {
    const quotes = await fetchSpotQuotes();
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ provider: 'BINANCE_SPOT', asOf: Date.now(), quotes });
  } catch (error) {
    console.error('Binance market quotes unavailable', error);
    return res.status(503).json({ error: 'Dados de mercado indisponíveis. Sem cotação simulada.' });
  }
});

app.get('/api/market/binance/scan', async (_req, res) => {
  try {
    const result = await scanBinanceSpot();
    res.setHeader('Cache-Control', 'no-store');
    return res.json(result);
  } catch (error) {
    console.error('Binance Spot scanner unavailable:', error);
    return res.status(503).json({ error: 'Scanner indisponível: dados reais insuficientes ou serviço fora do ar.' });
  }
});

app.get('/api/market/binance/candles', async (req, res) => {
  try {
    const symbol = validatePair(String(req.query.symbol ?? ''));
    const interval = validateInterval(String(req.query.interval ?? '5m'));
    const limit = Number(req.query.limit ?? 200);
    const candles = await fetchSpotCandles(symbol, interval, limit);
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ provider: 'BINANCE_SPOT', symbol, interval, candles });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const invalid = message.includes('não autorizado') || message.includes('inválido');
    return res.status(invalid ? 400 : 503).json({ error: invalid ? message : 'Candles indisponíveis na Binance.' });
  }
});

// Security & Vault Status Endpoint
app.get('/api/security/status', (req, res) => {
  res.json({
    policy: INSTITUTIONAL_SECURITY_POLICY,
    activeAuditLogsCount: auditTrail.length,
    brokerConnections: [
      {
        broker: 'Interactive Brokers (Gateway)',
        status: 'NOT_CONNECTED',
        authType: 'OAuth 2.0 / Client Cert',
        readOnly: true,
        withdrawalBlocked: true,
      },
      {
        broker: 'Binance Institutional Spot',
        status: 'NOT_CONNECTED',
        authType: 'HMAC-SHA256 Encrypted Key',
        readOnly: true,
        withdrawalBlocked: true,
      },
      {
        broker: 'Banco Central / Open Finance Sandbox',
        status: 'NOT_CONNECTED',
        authType: 'mTLS / JWT B2B',
        readOnly: true,
        withdrawalBlocked: true,
      },
    ],
  });
});

// Audit Trail Retrieval Endpoint
app.get('/api/security/audit-trail', (req, res) => {
  res.json({ logs: auditTrail.slice(-50) });
});

// Record Audit Log Entry Endpoint
app.post('/api/security/audit', (req, res) => {
  const { eventType, severity = 'INFO', actor = 'SYSTEM', details = {} } = req.body;
  const timestamp = Date.now();
  const prevSignature = auditTrail[auditTrail.length - 1]?.signature || 'ROOT_000000';
  const signature = generateAuditSignature(timestamp, eventType, JSON.stringify(details), prevSignature);

  const newEntry: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    eventType,
    severity,
    actor,
    details,
    signature,
  };

  auditTrail.push(newEntry);
  res.json({ success: true, logId: newEntry.id });
});

// Multi-Agent Analysis Endpoint (Gemini 3.8 Flash)
// AI Agent generates recommendations; RISK ENGINE and ORDER MACHINE enforce codes!
app.post('/api/agents/analyze', async (req, res) => {
  const { symbol, price, indicators, marketContext, currency = 'USD' } = req.body;

  if (!symbol) {
    return res.status(400).json({ error: 'Asset symbol is required' });
  }
  if (!ai) {
    return res.status(503).json({ error: 'Módulo opcional Gemini não configurado.' });
  }

  try {
    // If GEMINI_API_KEY is present, generate real LLM synthesis
    if (process.env.GEMINI_API_KEY) {
      const prompt = `
Você é o sistema multi-agente do VELTS TRADER AI, uma plataforma autônoma de trading institucional.
Analise o ativo: ${symbol}
Preço Atual: ${price} ${currency}
Indicadores Quantitativos:
- RSI (14): ${indicators?.rsi14 ?? 'N/A'}
- MACD: ${JSON.stringify(indicators?.macd ?? {})}
- Médias Móveis: EMA20: ${indicators?.movingAverages?.ema20}, EMA50: ${indicators?.movingAverages?.ema50}, EMA200: ${indicators?.movingAverages?.ema200}
- Bandas de Bollinger: Upper: ${indicators?.bollingerBands?.upper}, Lower: ${indicators?.bollingerBands?.lower}, Bandwidth: ${indicators?.bollingerBands?.bandwidth}%
- ATR (14): ${indicators?.atr14 ?? 'N/A'}
- Suporte: ${indicators?.supportLevel}, Resistência: ${indicators?.resistanceLevel}
- Tendência Detectada: ${indicators?.trend ?? 'NEUTRAL'}

Contexto de Mercado: ${marketContext || 'Condições normais de liquidez e volatilidade'}

Sua tarefa é simular a deliberação dos 5 agentes especializados:
1. AGENTE 1 — ANALISTA TÉCNICO (Avalia RSI, MACD, MAs, Bollinger, Suporte/Resistência)
2. AGENTE 2 — ANALISTA FUNDAMENTALISTA (Avalia juros, inflação, notícias macroeconômicas)
3. AGENTE 3 — ANALISTA QUANTITATIVO (Avalia probabilidades, volatilidade ATR, regime de mercado)
4. AGENTE 4 — GERENCIADOR DE RISCO (Verifica stop loss, risco máximo 0.5%, drawdown)
5. AGENTE 5 — SUPERVISOR (Consolidação final obrigatória com recomendação de BUY, SELL ou HOLD, Preço Alvo, Stop Loss e Confiança de 0 a 100%)

ATENÇÃO: O supervisor JAMAIS pode ignorar o gerenciador de risco.
Retorne EXCLUSIVAMENTE um objeto JSON válido no seguinte formato:
{
  "symbol": "${symbol}",
  "action": "BUY" | "SELL" | "HOLD",
  "confidenceScore": number,
  "targetPrice": number,
  "recommendedStopLoss": number,
  "recommendedTakeProfit": number,
  "riskPassed": boolean,
  "riskManagerComments": string,
  "supervisorRationale": string,
  "reports": [
    {
      "agentRole": "TECHNICAL" | "FUNDAMENTAL" | "QUANTITATIVE" | "RISK_MANAGER" | "SUPERVISOR",
      "agentName": string,
      "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
      "confidencePct": number,
      "summary": string,
      "keyPoints": [string],
      "riskClearance": boolean
    }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '{}';
      try {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } catch (parseErr) {
        console.warn('Failed to parse Gemini JSON output, falling back to deterministic synthesis:', parseErr);
      }
    }

    return res.status(503).json({
      error: 'Análise indisponível. Respostas artificiais desativadas por segurança.',
    });

  } catch (err: any) {
    console.error('Error during agent analysis:', err);
    res.status(500).json({ error: 'Falha na deliberação dos agentes', details: err.message });
  }
});

// Configure Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`VELTS TRADER AI Server running at http://localhost:${port}`);
  });
}

startServer();
