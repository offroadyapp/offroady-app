/**
 * In-memory rate limiter for email-related endpoints.
 *
 * Uses Map-based storage with automatic cleanup of expired entries.
 * Not suitable for multi-process deployments (serverless, multi-instance);
 * for production with multiple instances, use a DB-backed approach instead.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number; // 0 if allowed
}

const EMAIL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const IP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const EMAIL_MAX_REQUESTS = 1;
const IP_MAX_REQUESTS = 3;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

const emailStore = new Map<string, RateLimitEntry>();
const ipStore = new Map<string, RateLimitEntry>();

let lastCleanup = Date.now();

function cleanupStores(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of emailStore) {
    if (now >= entry.resetAt) {
      emailStore.delete(key);
    }
  }
  for (const [key, entry] of ipStore) {
    if (now >= entry.resetAt) {
      ipStore.delete(key);
    }
  }
}

function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // First request or window expired: reset
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfterMs = entry.resetAt - now;
    return { allowed: false, retryAfterMs };
  }

  // Increment within window
  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Checks rate limit for a specific email address.
 * Max 1 request per 15 minutes per email.
 */
export function checkEmailRateLimit(email: string): RateLimitResult {
  cleanupStores();
  const normalized = email.trim().toLowerCase();
  return checkRateLimit(emailStore, normalized, EMAIL_MAX_REQUESTS, EMAIL_WINDOW_MS);
}

/**
 * Checks rate limit for an IP address.
 * Max 3 requests per 15 minutes per IP.
 */
export function checkIpRateLimit(ip: string): RateLimitResult {
  cleanupStores();
  return checkRateLimit(ipStore, ip, IP_MAX_REQUESTS, IP_WINDOW_MS);
}

/**
 * Clears all rate limit entries (useful for testing).
 */
export function clearRateLimitStores(): void {
  emailStore.clear();
  ipStore.clear();
  lastCleanup = Date.now();
}
