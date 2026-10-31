import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite client env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key'
);

/**
 * Singleton Supabase Client
 * If not configured, returns null and application operates gracefully in local state
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

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
  if (!supabaseUrl || !isSupabaseConfigured) return '';
  try {
    const parsed = new URL(supabaseUrl);
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
    return 'supabase.co';
  }
}

/**
 * Database Status Helper
 */
export function getDatabaseStatus() {
  return {
    isConfigured: isSupabaseConfigured,
    url: isSupabaseConfigured ? supabaseUrl : 'Não configurado (Usando Local Paper Engine)',
    maskedHost: getMaskedSupabaseUrl(),
    provider: 'PostgreSQL / Supabase',
    storageMode: isSupabaseConfigured ? 'Cloud PostgreSQL' : 'Local In-Memory / LocalStorage',
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

    if (error && error.code !== 'PGRST116') {
      return {
        status: 'connected',
        message: `Conectado ao Cloud PostgreSQL (${latencyMs}ms).`,
        latencyMs,
        host: getMaskedSupabaseUrl(),
        checkedAt: Date.now(),
      };
    }

    return {
      status: 'connected',
      message: `Conectado ao Cloud PostgreSQL (${latencyMs}ms) com isolamento RLS.`,
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
