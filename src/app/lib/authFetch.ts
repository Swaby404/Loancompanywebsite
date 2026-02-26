/**
 * Centralized Authenticated Fetch Utility with Token Refresh
 * -----------------------------------------------------------
 * Provides secure, token-based API communication for Harvey's Loans.
 *
 * Token Refresh Strategy:
 *   1. PROACTIVE  – Before every authFetch call, check if the JWT expires
 *                   within the next TOKEN_REFRESH_BUFFER_MS (5 minutes).
 *                   If so, silently refresh via Supabase before making the request.
 *   2. REACTIVE   – If the server responds with 401, attempt ONE silent refresh
 *                   and retry the original request with the new token.
 *   3. BACKGROUND – A setInterval wakes up every SESSION_CHECK_INTERVAL_MS
 *                   (4 minutes) to proactively refresh tokens that are close
 *                   to expiry, keeping long-lived sessions alive.
 *   4. AUTH STATE  – We subscribe to Supabase's onAuthStateChange so that
 *                   TOKEN_REFRESHED events from Supabase itself are captured.
 *
 * Rate-Limit Awareness:
 *   - If the server responds with 429, authFetch returns it gracefully so the
 *     UI can show a "try again" message. It does NOT redirect.
 *
 * Usage:
 *   import { authFetch, publicFetch } from '../lib/authFetch';
 *
 *   // Protected route (auto-refreshes token if needed)
 *   const { data, ok, error } = await authFetch('/loan-applications');
 *
 *   // Public route (uses Supabase anon key)
 *   const { data, ok, error } = await publicFetch('/signup', {
 *     method: 'POST',
 *     body: JSON.stringify({ email, password, name }),
 *   });
 */

import { supabase, API_URL } from './supabase';
import { publicAnonKey } from '/utils/supabase/info';

// ── Configuration ──────────────────────────────────────────────────────

/** Refresh the token if it expires within this many milliseconds. */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/** How often the background watchdog checks the session (ms). */
const SESSION_CHECK_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

/** Maximum number of times we retry on 401 after a token refresh. */
const MAX_RETRY_ON_401 = 1;

// ── Types ──────────────────────────────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  /** If true, do NOT set Content-Type (useful for FormData uploads). */
  skipContentType?: boolean;
}

export interface FetchResult<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
  response: Response;
  /** True when the request was retried after a token refresh. */
  retried?: boolean;
  /** Present on 429 responses — seconds until the client can retry. */
  retryAfterSeconds?: number;
}

// ── Token Refresh Engine ───────────────────────────────────────────────

/** Tracks whether a refresh is already in-flight to prevent stampedes. */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Decode the `exp` claim from a JWT without a library.
 * Returns the expiry as a Unix timestamp (seconds), or null if unparseable.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

/**
 * Returns true when the token will expire within TOKEN_REFRESH_BUFFER_MS.
 */
function isTokenExpiringSoon(token: string): boolean {
  const exp = getTokenExpiry(token);
  if (!exp) return true; // Can't parse → treat as expired
  const nowSec = Math.floor(Date.now() / 1000);
  return exp - nowSec < TOKEN_REFRESH_BUFFER_MS / 1000;
}

/**
 * Attempt to silently refresh the Supabase session.
 * Returns the new access_token or null on failure.
 * Uses a single in-flight promise to prevent concurrent refreshes.
 */
async function refreshSession(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      console.log('🔄 Refreshing session token...');
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        console.error('Token refresh failed:', error?.message || 'No session returned');
        return null;
      }

      console.log('✅ Session token refreshed successfully');
      return data.session.access_token;
    } catch (err) {
      console.error('Token refresh exception:', err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Get a valid session token — refreshing proactively if it's about to expire.
 */
async function getValidToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return null;

    const token = session.access_token;

    // Proactive refresh if expiring soon
    if (isTokenExpiringSoon(token)) {
      console.log('⏰ Token expiring soon — refreshing proactively');
      const newToken = await refreshSession();
      return newToken ?? token; // Fall back to existing if refresh fails
    }

    return token;
  } catch (err) {
    console.error('getValidToken error:', err);
    return null;
  }
}

// ── Background Session Watchdog ────────────────────────────────────────

let watchdogInterval: ReturnType<typeof setInterval> | null = null;

function startSessionWatchdog(): void {
  if (watchdogInterval) return; // Already running

  watchdogInterval = setInterval(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // No active session — nothing to refresh

      if (isTokenExpiringSoon(session.access_token)) {
        console.log('🕐 Background watchdog: token expiring soon, refreshing...');
        await refreshSession();
      }
    } catch (err) {
      console.error('Session watchdog error:', err);
    }
  }, SESSION_CHECK_INTERVAL_MS);

  console.log(`🐕 Session watchdog started (checking every ${SESSION_CHECK_INTERVAL_MS / 1000}s)`);
}

function stopSessionWatchdog(): void {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
    console.log('🐕 Session watchdog stopped');
  }
}

// ── Supabase Auth State Listener ───────────────────────────────────────

let authListenerActive = false;

function initAuthListener(): void {
  if (authListenerActive) return;
  authListenerActive = true;

  supabase.auth.onAuthStateChange((event, session) => {
    switch (event) {
      case 'SIGNED_IN':
        console.log('🔑 Auth: User signed in');
        startSessionWatchdog();
        break;

      case 'TOKEN_REFRESHED':
        console.log('🔄 Auth: Token refreshed by Supabase');
        break;

      case 'SIGNED_OUT':
        console.log('🚪 Auth: User signed out');
        stopSessionWatchdog();
        break;
    }
  });

  // Start watchdog if there's already an active session
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) startSessionWatchdog();
  });
}

// Initialize the listener on module load
initAuthListener();

// ── 401 Handler ────────────────────────────────────────────────────────

async function handle401(endpoint: string): Promise<void> {
  console.error(`Authentication required or invalid token for: ${endpoint}`);
  stopSessionWatchdog();
  await supabase.auth.signOut();

  const isAdminEndpoint = endpoint.includes('/admin/');
  window.location.href = isAdminEndpoint ? '/admin/login' : '/signin';
}

// ── Core Fetch ─────────────────────────────────────────────────────────

async function coreFetch<T = any>(
  endpoint: string,
  token: string,
  options: FetchOptions = {},
): Promise<FetchResult<T>> {
  const { headers: customHeaders = {}, skipContentType, ...restOptions } = options;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    ...customHeaders,
  };

  // Content-Type handling
  const isFormData = restOptions.body instanceof FormData;
  if (!skipContentType && !headers['Content-Type'] && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (isFormData) {
    delete headers['Content-Type'];
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, { ...restOptions, headers });

    let data: T | null = null;
    const ct = response.headers.get('content-type');
    if (ct?.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorMsg = (data as any)?.error || `HTTP error! status: ${response.status}`;
      console.error(`API error [${response.status}] ${endpoint}: ${errorMsg}`);

      // Extract rate-limit info for 429 responses
      const retryAfterSeconds = response.status === 429
        ? parseInt(response.headers.get('Retry-After') || (data as any)?.retryAfterSeconds || '30', 10)
        : undefined;

      return { data, error: errorMsg, status: response.status, ok: false, response, retryAfterSeconds };
    }

    return { data, error: null, status: response.status, ok: true, response };
  } catch (err: any) {
    console.error(`Fetch error for ${endpoint}:`, err);
    return {
      data: null,
      error: err.message || 'Network error',
      status: 0,
      ok: false,
      response: new Response(null, { status: 0 }),
    };
  }
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Authenticated fetch with automatic token refresh.
 *
 * Flow:
 *   1. Get a valid token (proactively refreshing if near expiry).
 *   2. Make the request.
 *   3. On 401 → refresh token and retry ONCE.
 *   4. On second 401 or failed refresh → sign out and redirect.
 *   5. On 429 → return gracefully so the UI can display a message.
 */
export async function authFetch<T = any>(
  endpoint: string,
  options: FetchOptions & { redirectOn401?: boolean } = {},
): Promise<FetchResult<T>> {
  const { redirectOn401 = true, ...fetchOpts } = options;

  // Step 1 — get a valid (possibly refreshed) token
  let token = await getValidToken();

  if (!token) {
    console.error(`No active session for protected endpoint: ${endpoint}`);
    if (redirectOn401) await handle401(endpoint);
    return {
      data: null,
      error: 'No active session — please sign in.',
      status: 401,
      ok: false,
      response: new Response(null, { status: 401 }),
    };
  }

  // Step 2 — make the request
  let result = await coreFetch<T>(endpoint, token, fetchOpts);

  // Step 3 — reactive refresh on 401
  if (result.status === 401) {
    console.log('⚡ Got 401 — attempting reactive token refresh...');
    const newToken = await refreshSession();

    if (newToken) {
      console.log('🔁 Retrying request with refreshed token...');
      result = await coreFetch<T>(endpoint, newToken, fetchOpts);
      result.retried = true;

      // If still 401 after retry, give up
      if (result.status === 401 && redirectOn401) {
        await handle401(endpoint);
      }
    } else if (redirectOn401) {
      // Refresh failed entirely
      await handle401(endpoint);
    }
  }

  return result;
}

/**
 * Public (unauthenticated) fetch — uses the Supabase anon key.
 * Suitable for signup, forgot-password, admin/init, etc.
 */
export async function publicFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<FetchResult<T>> {
  return coreFetch<T>(endpoint, publicAnonKey, options);
}

/**
 * Manually retrieve a valid session token (e.g. for WebSocket auth).
 * Proactively refreshes if close to expiry.
 */
export { getValidToken as getSessionToken };

/**
 * Force a session refresh (useful after password change, etc.).
 */
export { refreshSession as forceTokenRefresh };
