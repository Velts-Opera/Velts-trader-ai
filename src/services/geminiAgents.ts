import type { CommitteeDecision, IndicatorSnapshot, Currency } from '../types/trading';

/**
 * Optional backend analysis. Fail closed: never manufacture a trading signal or
 * risk approval when external services are unavailable.
 */
export async function runAgentCommitteeAnalysis(
  symbol: string,
  price: number,
  indicators: IndicatorSnapshot,
  currency: Currency = 'USD',
  marketContext?: string,
): Promise<CommitteeDecision> {
  const response = await fetch('/api/agents/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, price, indicators, currency, marketContext }),
  });
  if (!response.ok) {
    throw new Error(`Serviço de análise indisponível (HTTP ${response.status}). Nenhuma recomendação foi produzida.`);
  }
  const decision = await response.json() as CommitteeDecision;
  if (!decision || decision.symbol !== symbol ||
      !['BUY', 'SELL', 'HOLD'].includes(decision.action) ||
      !Number.isFinite(decision.confidenceScore) || !Array.isArray(decision.reports)) {
    throw new Error('Resposta de análise inválida. Nenhuma operação permitida.');
  }
  // A model-generated claim is NOT a deterministic risk evaluation.
  return { ...decision, riskPassed: false,
    riskManagerComments: 'Pendente de validação determinística pelo motor de execução.' };
}
