/**
 * Rate Limiter Middleware for Harvey's Loans API
 * -----------------------------------------------
 * In-memory sliding-window rate limiter with tiered limits per route category.
 *
 * Tiers:
 *   AUTH_STRICT   → signup, signin, forgot-password, reset-password, admin/init  (5 req / 60s)
 *   AUTH_LOGIN    → signin, admin/login specifically                             (8 req / 60s)
 *   ADMIN         → all /admin/* routes                                          (40 req / 60s)
 *   UPLOAD        → file uploads                                                 (10 req / 60s)
 *   PAYMENT       → payment endpoints                                            (15 req / 60s)
 *   AUTHENTICATED → any other authenticated route                                (60 req / 60s)
 *   PUBLIC        → health, catch-all                                            (30 req / 60s)
 *
 * Keys are derived from IP + route-tier so a user hitting /signup is tracked
 * separately from the same IP hitting /loans.
 *
 * Stale entries are garbage-collected every 5 minutes.
 */

import type { Context, Next } from 'npm:hono@4';

// ── Configuration ──────────────────────────────────────────────────────

interface TierConfig {
  maxRequests: number;
  windowMs: number;     // sliding window in milliseconds
}

const TIERS: Record<string, TierConfig> = {
  AUTH_STRICT:    { maxRequests: 5,   windowMs: 60_000 },
  AUTH_LOGIN:     { maxRequests: 8,   windowMs: 60_000 },
  ADMIN:          { maxRequests: 40,  windowMs: 60_000 },
  UPLOAD:         { maxRequests: 10,  windowMs: 60_000 },
  PAYMENT:        { maxRequests: 15,  windowMs: 60_000 },
  AUTHENTICATED:  { maxRequests: 60,  windowMs: 60_000 },
  PUBLIC:         { maxRequests: 30,  windowMs: 60_000 },
};

// ── In-Memory Store ────────────────────────────────────────────────────

interface RequestLog {
  timestamps: number[];
}

const store = new Map<string, RequestLog>();

// Garbage-collect stale entries every 5 minutes
const GC_INTERVAL_MS = 5 * 60_000;
let lastGC = Date.now();

function garbageCollect(): void {
  const now = Date.now();
  if (now - lastGC < GC_INTERVAL_MS) return;
  lastGC = now;

  const maxWindow = Math.max(...Object.values(TIERS).map(t => t.windowMs));
  const cutoff = now - maxWindow;

  for (const [key, log] of store.entries()) {
    log.timestamps = log.timestamps.filter(ts => ts > cutoff);
    if (log.timestamps.length === 0) {
      store.delete(key);
    }
  }

  console.log(`🧹 Rate limiter GC: ${store.size} active keys remaining`);
}

// ── Tier Resolution ────────────────────────────────────────────────────

const PREFIX = '/make-server-a5671405';

function resolveTier(path: string, method: string): { tierName: string; config: TierConfig } {
  const p = path.replace(PREFIX, '');

  // Auth-strict routes (account creation / password management)
  if (p === '/signup' || p === '/forgot-password' || p === '/reset-password' || p === '/admin/init'
    || p === '/forgot-password-code' || p === '/verify-code-reset' || p === '/forgot-password-temp') {
    return { tierName: 'AUTH_STRICT', config: TIERS.AUTH_STRICT };
  }

  // Login-specific (slightly more generous so real users aren't blocked)
  if (p === '/signin' || p === '/admin/login') {
    return { tierName: 'AUTH_LOGIN', config: TIERS.AUTH_LOGIN };
  }

  // File uploads
  if (p === '/upload') {
    return { tierName: 'UPLOAD', config: TIERS.UPLOAD };
  }

  // Payment endpoints
  if (p === '/create-payment-intent' || p === '/record-payment' || p.match(/\/loans\/[^/]+\/payments/)) {
    return { tierName: 'PAYMENT', config: TIERS.PAYMENT };
  }

  // All admin routes
  if (p.startsWith('/admin')) {
    return { tierName: 'ADMIN', config: TIERS.ADMIN };
  }

  // Health check
  if (p === '/health') {
    return { tierName: 'PUBLIC', config: TIERS.PUBLIC };
  }

  // Everything else = authenticated user routes
  return { tierName: 'AUTHENTICATED', config: TIERS.AUTHENTICATED };
}

// ── Client Identifier ──────────────────────────────────────────────────

function getClientIdentifier(c: Context): string {
  // Prefer forwarded headers (Supabase Edge Functions sit behind a proxy)
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    // Take the first IP in the chain (original client)
    return forwarded.split(',')[0].trim();
  }

  const realIp = c.req.header('x-real-ip');
  if (realIp) return realIp;

  // Fall back to a generic identifier when headers aren't available
  // Also incorporate auth token fingerprint when present
  const authHeader = c.req.header('Authorization') || '';
  const tokenSnippet = authHeader.length > 20
    ? authHeader.slice(-12)
    : 'anonymous';

  return `unknown-${tokenSnippet}`;
}

// ── Middleware ──────────────────────────────────────────────────────────

/**
 * Rate limiter middleware.
 * Attach to Hono with `app.use('*', rateLimiter)`.
 *
 * On limit exceeded it returns 429 with a JSON body and standard headers:
 *   Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
 */
export async function rateLimiter(c: Context, next: Next): Promise<Response | void> {
  // Run GC opportunistically
  garbageCollect();

  const path = c.req.path;
  const method = c.req.method;

  // Skip preflight requests entirely
  if (method === 'OPTIONS') {
    return next();
  }

  const { tierName, config } = resolveTier(path, method);
  const clientId = getClientIdentifier(c);
  const storeKey = `${clientId}:${tierName}`;

  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get or create request log
  let log = store.get(storeKey);
  if (!log) {
    log = { timestamps: [] };
    store.set(storeKey, log);
  }

  // Remove timestamps outside the current window
  log.timestamps = log.timestamps.filter(ts => ts > windowStart);

  const remaining = Math.max(0, config.maxRequests - log.timestamps.length);
  const resetTime = Math.ceil((log.timestamps[0] || now) + config.windowMs);

  // Set rate limit headers on every response
  c.header('X-RateLimit-Limit', String(config.maxRequests));
  c.header('X-RateLimit-Remaining', String(remaining));
  c.header('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
  c.header('X-RateLimit-Tier', tierName);

  // Check if limit exceeded
  if (log.timestamps.length >= config.maxRequests) {
    const retryAfterSec = Math.ceil((log.timestamps[0] + config.windowMs - now) / 1000);

    console.log(
      `🚫 Rate limit exceeded: ${clientId} on tier ${tierName} ` +
      `(${log.timestamps.length}/${config.maxRequests} in ${config.windowMs / 1000}s) ` +
      `path=${path}`
    );

    c.header('Retry-After', String(Math.max(1, retryAfterSec)));

    return c.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfterSeconds: Math.max(1, retryAfterSec),
        tier: tierName,
        limit: config.maxRequests,
        windowSeconds: config.windowMs / 1000,
      },
      429,
    );
  }

  // Record this request
  log.timestamps.push(now);

  return next();
}

/**
 * Returns current rate-limiter stats (useful for admin/debug endpoints).
 */
export function getRateLimiterStats(): { activeKeys: number; entries: Record<string, number> } {
  const entries: Record<string, number> = {};
  for (const [key, log] of store.entries()) {
    entries[key] = log.timestamps.length;
  }
  return { activeKeys: store.size, entries };
}