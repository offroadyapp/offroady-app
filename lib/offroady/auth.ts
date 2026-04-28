import { getServiceSupabase, getServerAuthSupabase, getServerSupabaseFromCookies } from '@/lib/supabase/server';
import { slugifyProfile } from '@/lib/offroady/members';
import { claimInvitesForEmail } from '@/lib/offroady/invites';
import { ensureEmailPreferencesForUser } from '@/lib/offroady/email-preferences';

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

type UserRow = {
  id: string;
  auth_user_id: string | null;
  display_name: string;
  email: string;
  phone: string | null;
  profile_slug: string | null;
  avatar_image: string | null;
};

type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
};

type SessionCookieResponse = {
  cookies: {
    set: (name: string, value: string, options: {
      httpOnly: boolean;
      sameSite: 'lax';
      secure: boolean;
      path: string;
      expires?: Date;
      maxAge?: number;
    }) => void;
  };
};

type AuthUserLike = {
  id: string;
  email?: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: Array<{
    provider?: string | null;
    identity_data?: Record<string, unknown> | null;
  }> | null;
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

function ensureSessionToken(token: string, field: string) {
  const value = token.trim();
  if (!value) throw new Error(`${field} is required`);
  return value;
}

function readMetadataString(user: AuthUserLike, keys: string[]) {
  const sources = [
    user.user_metadata,
    ...(Array.isArray(user.identities)
      ? user.identities
          .map((identity) => identity.identity_data)
          .filter((value): value is Record<string, unknown> => Boolean(value))
      : []),
  ];

  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }

  return null;
}

function resolveAuthDisplayName(user: AuthUserLike) {
  const fullName = readMetadataString(user, ['display_name', 'full_name', 'name', 'user_name', 'preferred_username']);
  if (fullName) return fullName;

  const firstName = readMetadataString(user, ['given_name', 'first_name']);
  const lastName = readMetadataString(user, ['family_name', 'last_name']);
  const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (combinedName) return combinedName;

  const email = user.email?.trim();
  if (email) return email.split('@')[0];

  return `member-${user.id.slice(0, 8)}`;
}

function resolveAuthPhone(user: AuthUserLike) {
  return user.phone?.trim() || readMetadataString(user, ['phone', 'phone_number']) || null;
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

async function resolveProfileSlug(input: {
  authUserId: string;
  displayName: string;
  existingProfileId?: string;
}) {
  const supabase = getServiceSupabase();
  const baseSlug = slugifyProfile(input.displayName) || `member-${input.authUserId.slice(0, 8)}`;

  const { data: conflict, error } = await supabase
    .from('users')
    .select('id')
    .eq('profile_slug', baseSlug)
    .maybeSingle();

  if (error) throw error;
  if (!conflict || conflict.id === input.existingProfileId) return baseSlug;

  return `${baseSlug}-${input.authUserId.slice(0, 8)}`;
}

async function upsertProfileForAuthUser(input: {
  authUserId: string;
  displayName: string;
  email: string;
  phone?: string | null;
}) {
  const supabase = getServiceSupabase();

  const { data: existingByAuth, error: existingByAuthError } = await supabase
    .from('users')
    .select('id, auth_user_id, display_name, email, phone, profile_slug, avatar_image')
    .eq('auth_user_id', input.authUserId)
    .maybeSingle();

  if (existingByAuthError) throw existingByAuthError;

  if (existingByAuth) {
    const profileSlug = await resolveProfileSlug({
      authUserId: input.authUserId,
      displayName: input.displayName,
      existingProfileId: existingByAuth.id,
    });

    const { data, error } = await supabase
      .from('users')
      .update({
        display_name: input.displayName,
        email: input.email,
        phone: input.phone || null,
        profile_slug: profileSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingByAuth.id)
      .select('id, auth_user_id, display_name, email, phone, profile_slug, avatar_image')
      .single();

    if (error) throw error;
    return mapUser(data as UserRow);
  }

  const { data: existingByEmail, error: existingByEmailError } = await supabase
    .from('users')
    .select('id, auth_user_id, display_name, email, phone, profile_slug, avatar_image')
    .ilike('email', input.email)
    .maybeSingle();

  if (existingByEmailError) throw existingByEmailError;

  if (existingByEmail) {
    const profileSlug = await resolveProfileSlug({
      authUserId: input.authUserId,
      displayName: input.displayName,
      existingProfileId: existingByEmail.id,
    });

    const { data, error } = await supabase
      .from('users')
      .update({
        auth_user_id: input.authUserId,
        display_name: input.displayName,
        email: input.email,
        phone: input.phone || null,
        profile_slug: profileSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingByEmail.id)
      .select('id, auth_user_id, display_name, email, phone, profile_slug, avatar_image')
      .single();

    if (error) throw error;
    return mapUser(data as UserRow);
  }

  const profileSlug = await resolveProfileSlug({
    authUserId: input.authUserId,
    displayName: input.displayName,
  });

  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_user_id: input.authUserId,
      display_name: input.displayName,
      email: input.email,
      phone: input.phone || null,
      profile_slug: profileSlug,
    })
    .select('id, auth_user_id, display_name, email, phone, profile_slug, avatar_image')
    .single();

  if (error) throw error;
  return mapUser(data as UserRow);
}

async function getProfileForAuthUser(authUserId: string, fallback?: { email?: string | null; displayName?: string | null }) {
  const supabase = getServiceSupabase();
  const { data: existing, error } = await supabase
    .from('users')
    .select('id, auth_user_id, display_name, email, phone, profile_slug, avatar_image')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw error;
  if (existing) return mapUser(existing as UserRow);

  if (!fallback?.email) {
    throw new Error('No profile found for authenticated user');
  }

  return upsertProfileForAuthUser({
    authUserId,
    displayName: fallback.displayName?.trim() || fallback.email.split('@')[0],
    email: fallback.email,
    phone: null,
  });
}

async function createConfirmedAuthUser(input: {
  displayName: string;
  email: string;
  phone: string | null;
  password: string;
}) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      display_name: input.displayName,
      phone: input.phone,
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Failed to create auth user');
  return data.user;
}

export async function createAccount(input: AuthIdentityInput) {
  const authSupabase = getServerAuthSupabase();
  const displayName = ensureText(input.displayName, 'Display name', 50);
  const email = ensureText(normalizeEmail(input.email), 'Email', 160);
  const phone = input.phone?.trim() || null;
  const password = ensurePassword(input.password);

  const authUser = await createConfirmedAuthUser({
    displayName,
    email,
    phone,
    password,
  });

  const { data: signInData, error: signInError } = await authSupabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) throw signInError;
  if (!signInData.user || !signInData.session) throw new Error('Failed to establish session');

  const profile = await upsertProfileForAuthUser({
    authUserId: authUser.id,
    displayName,
    email,
    phone,
  });

  await ensureEmailPreferencesForUser(email, profile.id);
  await claimInvitesForEmail(email, profile.id);

  return { user: profile, session: signInData.session };
}

export async function loginAccount(emailInput: string, passwordInput: string) {
  const authSupabase = getServerAuthSupabase();
  const email = ensureText(normalizeEmail(emailInput), 'Email', 160);
  const password = ensurePassword(passwordInput);

  const { data, error } = await authSupabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user || !data.session) throw new Error('Invalid email or password');

  const profile = await getProfileForAuthUser(data.user.id, {
    email: data.user.email,
    displayName: resolveAuthDisplayName(data.user as AuthUserLike),
  });

  await ensureEmailPreferencesForUser(profile.email, profile.id);
  await claimInvitesForEmail(profile.email, profile.id);

  return {
    user: profile,
    session: data.session,
  };
}

export async function completeOAuthSession(input: {
  accessToken: string;
  refreshToken: string;
}) {
  const authSupabase = getServerAuthSupabase();
  const accessToken = ensureSessionToken(input.accessToken, 'Access token');
  const refreshToken = ensureSessionToken(input.refreshToken, 'Refresh token');

  const { data, error } = await authSupabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
  if (!data.user || !data.session) throw new Error('Failed to establish social login session');

  const resolvedUser = data.user as AuthUserLike;
  const email = ensureText(
    normalizeEmail(data.user.email || readMetadataString(resolvedUser, ['email']) || ''),
    'Email',
    160,
  );

  const profile = await upsertProfileForAuthUser({
    authUserId: data.user.id,
    displayName: resolveAuthDisplayName(resolvedUser),
    email,
    phone: resolveAuthPhone(resolvedUser),
  });

  await ensureEmailPreferencesForUser(profile.email, profile.id);
  await claimInvitesForEmail(profile.email, profile.id);

  return {
    user: profile,
    session: data.session,
  };
}

export async function getSessionUser() {
  const supabase = await getServerSupabaseFromCookies();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return getProfileForAuthUser(data.user.id, {
    email: data.user.email,
    displayName: resolveAuthDisplayName(data.user as AuthUserLike),
  });
}

export function attachSessionCookie(response: SessionCookieResponse, session: SupabaseSession) {
  const secure = process.env.NODE_ENV === 'production';
  const maxAge = session.expires_in ?? 60 * 60;
  response.cookies.set('sb-access-token', session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge,
  });
  response.cookies.set('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const supabase = await getServerSupabaseFromCookies();
  await supabase.auth.signOut();
}

export function clearAuthCookies(response: SessionCookieResponse) {
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set('sb-access-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires: new Date(0),
  });
  response.cookies.set('sb-refresh-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires: new Date(0),
  });
}
