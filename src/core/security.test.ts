import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  generateAuditSignature, 
  SlidingWindowRateLimiter, 
  IdempotencyTokenManager,
  INSTITUTIONAL_SECURITY_POLICY
} from './security';

test('generateAuditSignature produces consistent tamper-evident hash', () => {
  const ts = 1730000000000;
  const sig1 = generateAuditSignature(ts, 'ORDER_INTENT_CREATED', '{"symbol":"BTC"}');
  const sig2 = generateAuditSignature(ts, 'ORDER_INTENT_CREATED', '{"symbol":"BTC"}');
  assert.equal(sig1, sig2);
  assert.ok(sig1.startsWith('sig_'));
});

test('SlidingWindowRateLimiter throttles requests after ceiling', () => {
  const limiter = new SlidingWindowRateLimiter(3, 1000); // 3 req per sec
  assert.equal(limiter.checkAllowed().allowed, true);
  assert.equal(limiter.checkAllowed().allowed, true);
  assert.equal(limiter.checkAllowed().allowed, true);
  // 4th request must be rejected
  const fourth = limiter.checkAllowed();
  assert.equal(fourth.allowed, false);
  assert.ok(fourth.retryAfterMs > 0);
});

test('IdempotencyTokenManager detects duplicate orders in time window', () => {
  const mgr = new IdempotencyTokenManager();
  const first = mgr.validateAndLock('BTC/USD', 'BUY', 0.5);
  assert.equal(first, true);

  // Exact same order immediately attempted
  const second = mgr.validateAndLock('BTC/USD', 'BUY', 0.5);
  assert.equal(second, false); // Blocked as duplicate!

  // Different asset or quantity is allowed
  const different = mgr.validateAndLock('ETH/USD', 'BUY', 0.5);
  assert.equal(different, true);
});

test('Institutional security policy enforces AI Air Gap and Zero Withdrawal Keys', () => {
  assert.equal(INSTITUTIONAL_SECURITY_POLICY.aiAirGapEnforced, true);
  assert.equal(INSTITUTIONAL_SECURITY_POLICY.readOnlyCredentialsOnly, true);
  assert.equal(INSTITUTIONAL_SECURITY_POLICY.vaultEncryption, 'AES-256-GCM');
});
