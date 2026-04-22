import { getSessionUser, type SessionUser } from '@/lib/offroady/auth';

export type InternalAccess = {
  user: SessionUser | null;
  via: 'session' | 'secret';
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getInternalAdminEmails() {
  const raw = process.env.OFFROADY_INTERNAL_EMAILS ?? process.env.INTERNAL_ADMIN_EMAILS ?? '';
  return new Set(
    raw
      .split(/[;,\n]+/)
      .map((value) => normalizeEmail(value))
      .filter(Boolean)
  );
}

export function hasInternalApiSecret(request: Request) {
  const secret = process.env.OFFROADY_INTERNAL_API_SECRET;
  if (!secret) return false;
  const incoming = request.headers.get('x-offroady-internal-secret')?.trim();
  return Boolean(incoming && incoming === secret);
}

export async function requireInternalAccess(request?: Request): Promise<InternalAccess> {
  if (request && hasInternalApiSecret(request)) {
    return { user: null, via: 'secret' };
  }

  const user = await getSessionUser();
  if (!user) {
    throw new Error('Please sign in to access internal weekly digest tools.');
  }

  const admins = getInternalAdminEmails();
  if (admins.size > 0 && !admins.has(normalizeEmail(user.email))) {
    throw new Error('Your account does not have access to internal weekly digest tools.');
  }

  return { user, via: 'session' };
}
