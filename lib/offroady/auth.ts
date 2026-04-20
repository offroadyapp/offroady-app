import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { getServiceSupabase } from '@/lib/supabase/server';
import { slugifyProfile } from '@/lib/offroady/members';
import { claimInvitesForEmail } from '@/lib/offroady/invites';

const SESSION_COOKIE = 'offroady_session';
const SESSION_TTL_DAYS = 30;

export type AuthIdentityInput = {
  displayName: string;
  email: string;
  phone?: string;
  password: string;
};

export type SessionUser = {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  profileSlug: string | null;
  avatarImage: string | null;
};

function ensurePasswordReset(password: string) {
  return ensurePassword(password);
}

type UserRow = {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  profile_slug: string | null;
  avatar_image: string | null;
  password_hash?: string | null;
};

type SessionCookieResponse = {
  cookies: {
    set: (name: string, value: string, options: {
      httpOnly: boolean;
      sameSite: 'lax';
      secure: boolean;
      path: string;
      expires: Date;
    }) => void;
  };
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function ensureText(value: string, field: string, max = 120) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${field} is required`);
  if (trimmed.length > max) throw new Error(`${field} is too long`);
  return trimmed;
}

function ensurePassword(password: string) {
  const value = password.trim();
  if (value.length < 6) throw new Error('Password must be at least 6 characters');
  if (value.length > 100) throw new Error('Password is too long');
  return value;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(originalHash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function mapUser(data: UserRow): SessionUser {
  return {
    id: data.id,
    displayName: data.display_name,
    email: data.email,
    phone: data.phone || null,
    profileSlug: data.profile_slug || null,
    avatarImage: data.avatar_image || null,
  };
}

async function createSession(userId: string) {
  const supabase = getServiceSupabase();
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('user_sessions').insert({
    user_id: userId,
    session_token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) throw error;
  return { token, expiresAt };
}

export async function createAccount(input: AuthIdentityInput) {
  const supabase = getServiceSupabase();
  const displayName = ensureText(input.displayName, 'Display name', 50);
  const email = ensureText(normalizeEmail(input.email), 'Email', 160);
  const phone = input.phone?.trim() || null;
  const password = ensurePassword(input.password);
  const profileSlug = slugifyProfile(displayName);
  const passwordHash = hashPassword(password);

  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id, display_name, email, phone, profile_slug, avatar_image, password_hash')
    .ilike('email', email)
    .maybeSingle();

  if (existingError) throw existingError;

  let user;
  if (existing) {
    if (existing.password_hash) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        display_name: displayName,
        email,
        phone,
        profile_slug: profileSlug,
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, display_name, email, phone, profile_slug, avatar_image')
      .single();

    if (error) throw error;
    user = data;
  } else {
    const { data, error } = await supabase
      .from('users')
      .insert({
        display_name: displayName,
        email,
        phone,
        profile_slug: profileSlug,
        password_hash: passwordHash,
      })
      .select('id, display_name, email, phone, profile_slug, avatar_image')
      .single();

    if (error) throw error;
    user = data;
  }

  await claimInvitesForEmail(email, user.id);
  const session = await createSession(user.id);
  return { user: mapUser(user), session };
}

export async function loginAccount(emailInput: string, passwordInput: string) {
  const supabase = getServiceSupabase();
  const email = ensureText(normalizeEmail(emailInput), 'Email', 160);
  const password = ensurePassword(passwordInput);

  const { data: user, error } = await supabase
    .from('users')
    .select('id, display_name, email, phone, profile_slug, avatar_image, password_hash')
    .ilike('email', email)
    .maybeSingle();

  if (error) throw error;
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error('Invalid email or password');
  }

  await claimInvitesForEmail(user.email, user.id);
  const session = await createSession(user.id);
  return {
    user: mapUser(user),
    session,
  };
}

export async function resetPassword(emailInput: string, passwordInput: string) {
  const supabase = getServiceSupabase();
  const email = ensureText(normalizeEmail(emailInput), 'Email', 160);
  const passwordHash = hashPassword(ensurePasswordReset(passwordInput));

  const { data: user, error } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .ilike('email', email)
    .select('id, display_name, email, phone, profile_slug, avatar_image')
    .maybeSingle();

  if (error) throw error;
  if (!user) throw new Error('No account found for that email');

  const session = await createSession(user.id);
  return {
    user: mapUser(user),
    session,
  };
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const supabase = getServiceSupabase();
  const now = new Date().toISOString();

  const { data: session, error: sessionError } = await supabase
    .from('user_sessions')
    .select('id, user_id, expires_at')
    .eq('session_token_hash', tokenHash)
    .gt('expires_at', now)
    .maybeSingle();

  if (sessionError || !session) return null;

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, display_name, email, phone, profile_slug, avatar_image')
    .eq('id', session.user_id)
    .maybeSingle();

  if (userError || !user) return null;
  return mapUser(user);
}

export function attachSessionCookie(response: SessionCookieResponse, token: string, expiresAt: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function clearSession(token?: string | null) {
  if (!token) return;
  const supabase = getServiceSupabase();
  await supabase.from('user_sessions').delete().eq('session_token_hash', hashSessionToken(token));
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
