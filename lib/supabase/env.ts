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

function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return null;
}

function inferSupabaseUrlFromKnownKeys() {
  const token = firstEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload?.ref) return null;
  return `https://${payload.ref}.supabase.co`;
}

export function getSupabaseUrl() {
  const explicit = firstEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL');
  if (explicit) return explicit;

  const inferred = inferSupabaseUrlFromKnownKeys();
  if (inferred) return inferred;

  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey() {
  const value = firstEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');
  if (!value) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return value;
}

export function getSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }
  return value;
}

