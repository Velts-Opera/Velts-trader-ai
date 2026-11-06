import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials safely from Vite client env
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Validates whether a string is a valid HTTP or HTTPS URL
 */
function isValidHttpOrHttpsUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  if (!trimmed.toLowerCase().startsWith('http://') && !trimmed.toLowerCase().startsWith('https://')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Checks if a value is a placeholder or template value
 */
function isPlaceholder(value: string): boolean {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) return true;

  const knownPlaceholders = [
    'https://your-project.supabase.co',
    'http://your-project.supabase.co',
    'your-project.supabase.co',
    'your-project',
    'your-anon-key',
    'your_anon_key',
    'your-key',
    'my_supabase_url',
    'my_supabase_anon_key',
    'placeholder',
    'undefined',
    'null',
    'none',
  ];

  if (knownPlaceholders.includes(trimmed)) return true;
  if (trimmed.includes('<project>') || trimmed.includes('<your-project>') || trimmed.includes('your-project')) {
    return true;
  }

  return false;
}

/**
 * Strict validation: URL must be valid HTTP/HTTPS and key must be non-empty & not a placeholder
 */
export const isSupabaseConfigured: boolean = Boolean(
  rawUrl &&
  rawKey &&
  !isPlaceholder(rawUrl) &&
  !isPlaceholder(rawKey) &&
  isValidHttpOrHttpsUrl(rawUrl)
);

/**
 * Safe Supabase Client Initializer
 * Wraps initialization in try/catch to ensure unhandled initialization exceptions never crash React
 */
function createSafeSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    return createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Falha segura na inicialização do Supabase Client (mantendo modo Paper Trading local):', err);
    return null;
  }
}

/**
 * Singleton Supabase Client
 * If unconfigured or initialization fails, remains null and app uses local Paper Trading engine
 */
export const supabase: SupabaseClient | null = createSafeSupabaseClient();

export type SupabaseConnectionStatus = 'connected' | 'unconfigured' | 'error' | 'checking';

export interface SupabaseHealthResult {
  status: SupabaseConnectionStatus;
  message: string;
  latencyMs?: number;
  host?: string;
  checkedAt: number;
}

/**
 * Masked URL helper for UI display (e.g. https://xyz***.supabase.co)
 */
export function getMaskedSupabaseUrl(): string {
  if (!rawUrl || !isSupabaseConfigured || !isValidHttpOrHttpsUrl(rawUrl)) return '';
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname;
    const parts = host.split('.');
    if (parts.length > 2) {
      const projId = parts[0];
      const masked = projId.length > 6 
        ? `${projId.slice(0, 4)}•••${projId.slice(-2)}.${parts.slice(1).join('.')}` 
        : host;
      return masked;
    }
    return host;
  } catch {
    return '';
  }
}

/**
 * Database Status Helper
 */
export function getDatabaseStatus() {
  const isReady = Boolean(isSupabaseConfigured && supabase);
  return {
    isConfigured: isReady,
    url: isReady ? rawUrl : 'Não configurado (Usando Local Paper Engine)',
    maskedHost: getMaskedSupabaseUrl(),
    provider: 'PostgreSQL / Supabase',
    storageMode: isReady ? 'Cloud PostgreSQL' : 'Local In-Memory / LocalStorage',
  };
}

/**
 * Connection Health Check Probe
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      status: 'unconfigured',
      message: 'Supabase não configurado. Motor Paper Trading operando localmente no navegador.',
      checkedAt: Date.now(),
    };
  }

  const start = performance.now();
  try {
    // Probe market_data or orders table with limit 1
    const { error } = await supabase.from('market_data').select('symbol').limit(1);
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      return {
        status: 'error',
        message: `Endpoint Supabase acessível, mas a consulta falhou: ${error.message}`,
        latencyMs,
        host: getMaskedSupabaseUrl(),
        checkedAt: Date.now(),
      };
    }

    return {
      status: 'connected',
      message: `Supabase respondeu à consulta de leitura (${latencyMs}ms).`,
      latencyMs,
      host: getMaskedSupabaseUrl(),
      checkedAt: Date.now(),
    };
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || 'Falha de comunicação com o endpoint do Supabase.',
      checkedAt: Date.now(),
    };
  }
}

/**
 * Persistence service for sync between Local Engine and Supabase
 */
export const dbService = {
  /**
   * Records an order state transition to Supabase (if connected) or local log
   */
  async saveOrder(order: any, userId?: string) {
    if (!supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('orders')
        .upsert({
          id: order.id,
          user_id: userId,
          client_order_id: order.clientOrderId,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          quantity: order.quantity,
          target_price: order.targetPrice,
          stop_loss_price: order.stopLossPrice,
          take_profit_price: order.takeProfitPrice,
          executed_price: order.executedPrice,
          slippage: order.slippage,
          fee: order.fee,
          state: order.state,
          state_history: order.stateHistory,
          currency: order.currency,
          is_paper: order.isPaper ?? true,
          rejection_reason: order.rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase saveOrder error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Failed to persist order to Supabase:', err);
      return null;
    }
  },

  /**
   * Records an audit log event
   */
  async recordAudit(eventType: string, details: Record<string, any>, severity: 'INFO' | 'WARN' | 'CRITICAL' = 'INFO', userId?: string) {
    if (!supabase) return;
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        event_type: eventType,
        severity,
        details,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to record audit log:', err);
    }
  },

  async saveScannerSnapshot(snapshot: any) {
    const record = {
      symbol: snapshot.symbol,
      timeframe: snapshot.timeframe,
      price: snapshot.price,
      rsi14: snapshot.rsi14,
      ema20: snapshot.ema20,
      ema50: snapshot.ema50,
      macd_histogram: snapshot.macdHistogram,
      atr_pct: snapshot.atrPct,
      volume_ratio: snapshot.volumeRatio,
      trend: snapshot.trend,
      classification: snapshot.classification,
      reasons: snapshot.reasons,
      observed_at: new Date(snapshot.asOf || Date.now()).toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('codextrader_scanner_history') || '[]');
      const next = [record, ...existing].slice(0, 200);
      localStorage.setItem('codextrader_scanner_history', JSON.stringify(next));
    } catch {
      // localStorage may be unavailable in private/restricted contexts.
    }

    if (!supabase) return { cloudSaved: false, localSaved: true };
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return { cloudSaved: false, localSaved: true };
      const { error } = await supabase.from('scanner_history').insert({
        ...record,
        user_id: authData.user.id,
      });
      if (error) {
        console.warn('Supabase scanner history error:', error.message);
        return { cloudSaved: false, localSaved: true };
      }
      return { cloudSaved: true, localSaved: true };
    } catch (err) {
      console.warn('Failed to persist scanner history:', err);
      return { cloudSaved: false, localSaved: true };
    }
  },

  async getLocalScannerHistory() {
    try {
      return JSON.parse(localStorage.getItem('codextrader_scanner_history') || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Logs AI Agent Committee reasoning to database
   */
  async logAgentAnalysis(report: any, assetSymbol: string, userId?: string) {
    if (!supabase) return;
    try {
      await supabase.from('agent_analysis_logs').insert({
        user_id: userId,
        agent_role: report.agentRole,
        sentiment: report.sentiment,
        confidence_score: report.confidencePct,
        summary: report.summary,
        key_points: report.keyPoints,
        metrics: report.metrics,
        risk_cleared: report.riskClearance,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to log agent analysis:', err);
    }
  }
};
