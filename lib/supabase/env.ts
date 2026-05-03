function decodeJwtPayload(token: string) {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payloadText = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(payloadText) as { ref?: string };
    return payload;
  } catch {
    return null;
  }
}

// Next.js inlines process.env.NEXT_PUBLIC_* only with static property access.
// Dynamic access via process.env[name] returns undefined on the client side.
// These constants use static access so the bundler can inline them at build time.
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseUrlFromJwt() {
  const token = NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload?.ref) return null;
  return `https://${payload.ref}.supabase.co`;
}

export function getSupabaseUrl(): string | null {
  // Static access: works in both server and client (inlined by bundler)
  if (NEXT_PUBLIC_SUPABASE_URL) return NEXT_PUBLIC_SUPABASE_URL;
  // Fallback for server-only
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;

  // Last resort: infer from the JWT key
  return getSupabaseUrlFromJwt();
}

export function getSupabaseAnonKey(): string | null {
  if (NEXT_PUBLIC_SUPABASE_ANON_KEY) return NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
  return null;
}

export function requireSupabaseUrl(): string {
  const url = getSupabaseUrl();
  if (!url) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  return url;
}

export function requireSupabaseAnonKey(): string {
  const key = getSupabaseAnonKey();
  if (!key) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return key;
}

export function getSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }
  return value;
}
