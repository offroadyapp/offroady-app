import { randomBytes } from 'crypto';
import { getServiceSupabase } from '@/lib/supabase/server';

export type EmailPreferenceCategory =
  | 'weeklyTrailUpdates'
  | 'tripNotifications'
  | 'crewNotifications'
  | 'commentReplyNotifications'
  | 'marketingPromotionalEmails';

export type EmailPreferences = {
  email: string;
  weeklyTrailUpdates: boolean;
  tripNotifications: boolean;
  crewNotifications: boolean;
  commentReplyNotifications: boolean;
  marketingPromotionalEmails: boolean;
};

const defaultPreferences: Omit<EmailPreferences, 'email'> = {
  weeklyTrailUpdates: true,
  tripNotifications: true,
  crewNotifications: true,
  commentReplyNotifications: true,
  marketingPromotionalEmails: true,
};

const fieldMap: Record<EmailPreferenceCategory, keyof typeof defaultPreferences> = {
  weeklyTrailUpdates: 'weeklyTrailUpdates',
  tripNotifications: 'tripNotifications',
  crewNotifications: 'crewNotifications',
  commentReplyNotifications: 'commentReplyNotifications',
  marketingPromotionalEmails: 'marketingPromotionalEmails',
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type EmailPreferencesRow = {
  weekly_trail_updates?: boolean | null;
  trip_notifications?: boolean | null;
  crew_notifications?: boolean | null;
  comment_reply_notifications?: boolean | null;
  marketing_promotional_emails?: boolean | null;
};

function mapRow(row: EmailPreferencesRow | null | undefined, email: string): EmailPreferences {
  return {
    email,
    weeklyTrailUpdates: row?.weekly_trail_updates ?? true,
    tripNotifications: row?.trip_notifications ?? true,
    crewNotifications: row?.crew_notifications ?? true,
    commentReplyNotifications: row?.comment_reply_notifications ?? true,
    marketingPromotionalEmails: row?.marketing_promotional_emails ?? true,
  };
}

function toRowPatch(input: Partial<Omit<EmailPreferences, 'email'>>) {
  const patch: Record<string, boolean> = {};
  if (typeof input.weeklyTrailUpdates === 'boolean') patch.weekly_trail_updates = input.weeklyTrailUpdates;
  if (typeof input.tripNotifications === 'boolean') patch.trip_notifications = input.tripNotifications;
  if (typeof input.crewNotifications === 'boolean') patch.crew_notifications = input.crewNotifications;
  if (typeof input.commentReplyNotifications === 'boolean') patch.comment_reply_notifications = input.commentReplyNotifications;
  if (typeof input.marketingPromotionalEmails === 'boolean') patch.marketing_promotional_emails = input.marketingPromotionalEmails;
  return patch;
}

export async function getEmailPreferencesByEmail(email: string, userId?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_email_preferences')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    await supabase.from('user_email_preferences').upsert({
      email: normalizedEmail,
      user_id: userId ?? null,
    });
    return { email: normalizedEmail, ...defaultPreferences } satisfies EmailPreferences;
  }

  if (userId && data.user_id !== userId) {
    await supabase.from('user_email_preferences').update({ user_id: userId }).eq('email', normalizedEmail);
  }

  return mapRow(data, normalizedEmail);
}

export async function updateEmailPreferencesByEmail(email: string, patch: Partial<Omit<EmailPreferences, 'email'>>, userId?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');

  const supabase = getServiceSupabase();
  const payload = {
    email: normalizedEmail,
    user_id: userId ?? null,
    ...toRowPatch(patch),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('user_email_preferences').upsert(payload, { onConflict: 'email' });
  if (error) throw error;

  return getEmailPreferencesByEmail(normalizedEmail, userId);
}

export async function createEmailPreferenceToken(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');

  const supabase = getServiceSupabase();
  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString();

  const { error } = await supabase.from('email_preference_tokens').insert({
    email: normalizedEmail,
    token,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return token;
}

export async function getEmailPreferencesByToken(token: string) {
  const normalizedToken = token.trim();
  if (!normalizedToken) throw new Error('Token is required');

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('email_preference_tokens')
    .select('email, expires_at')
    .eq('token', normalizedToken)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Invalid unsubscribe link');
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    throw new Error('This unsubscribe link has expired');
  }

  await supabase.from('email_preference_tokens').update({ last_used_at: new Date().toISOString() }).eq('token', normalizedToken);
  return getEmailPreferencesByEmail(data.email);
}

export async function updateEmailPreferencesByToken(token: string, patch: Partial<Omit<EmailPreferences, 'email'>>) {
  const normalizedToken = token.trim();
  if (!normalizedToken) throw new Error('Token is required');

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('email_preference_tokens')
    .select('email, expires_at')
    .eq('token', normalizedToken)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Invalid unsubscribe link');
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    throw new Error('This unsubscribe link has expired');
  }

  await supabase.from('email_preference_tokens').update({ last_used_at: new Date().toISOString() }).eq('token', normalizedToken);
  return updateEmailPreferencesByEmail(data.email, patch);
}

export async function unsubscribeCategoryByToken(token: string, category: EmailPreferenceCategory) {
  const field = fieldMap[category];
  return updateEmailPreferencesByToken(token, { [field]: false });
}

export async function buildEmailPreferenceLinks(email: string, origin?: string) {
  const token = await createEmailPreferenceToken(email);
  const root = origin || '';
  return {
    unsubscribeUrl: `${root}/unsubscribe/${token}`,
    preferencesUrl: `${root}/email-preferences?token=${token}`,
    token,
  };
}

export async function buildEmailFooter(email: string, category: EmailPreferenceCategory, origin?: string) {
  const links = await buildEmailPreferenceLinks(email, origin);
  const unsubscribeUrl = `${links.unsubscribeUrl}?category=${encodeURIComponent(category)}`;
  return `\n\nUnsubscribe: ${unsubscribeUrl}\nManage Email Preferences: ${links.preferencesUrl}`;
}
